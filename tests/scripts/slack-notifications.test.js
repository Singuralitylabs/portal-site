const { sendSlackNotification } = require("../../scripts/slack-webhook.cjs");
const {
  FAILURE_CONCLUSIONS,
  shouldNotify,
  buildSlackMessage,
} = require("../../scripts/action-failure-slack-notification.cjs");
const wiki = require("../../scripts/wiki-slack-notification.cjs");
const dependabot = require("../../scripts/dependabot-slack-notification.cjs");
const { validateWorkflows } = require("../../scripts/check-workflow-notifications.cjs");
const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const run = {
  name: "Build Test",
  head_branch: "main",
  conclusion: "failure",
  head_repository: { full_name: "example/portal" },
  run_attempt: 2,
  event: "workflow_dispatch",
  head_sha: "abc123",
  html_url: "https://github.com/example/portal/actions/runs/123",
};

describe("Actions notifications", () => {
  test.each(FAILURE_CONCLUSIONS)("notifies %s on both allowed branches", conclusion => {
    for (const head_branch of ["main", "release"]) {
      expect(shouldNotify({ ...run, head_branch, conclusion }, "example/portal")).toBe(true);
    }
  });

  test.each(["success", "cancelled", "skipped", "neutral", "action_required", null])(
    "does not notify %s",
    conclusion => {
      expect(shouldNotify({ ...run, conclusion }, "example/portal")).toBe(false);
    }
  );

  test("rejects forks, other branches and missing metadata", () => {
    expect(shouldNotify(run, "other/repository")).toBe(false);
    expect(shouldNotify({ ...run, head_branch: "feature/test" }, "example/portal")).toBe(false);
    expect(shouldNotify({ ...run, head_repository: null }, "example/portal")).toBe(false);
    expect(shouldNotify(null, "example/portal")).toBe(false);
  });

  test("includes result and identifies the triggering attempt", () => {
    const message = buildSlackMessage(run);
    for (const value of ["Build Test", "main", "failure", "2", "workflow_dispatch", "abc123"]) {
      expect(message).toContain(value);
    }
    expect(message).toContain(`${run.html_url}/attempts/2`);
    expect(buildSlackMessage({ ...run, run_attempt: 3 })).not.toEqual(message);
  });
});

describe("Workflow notification consistency", () => {
  function readWorkflows() {
    const directory = path.join(__dirname, "../../.github/workflows");
    return Object.fromEntries(
      fs
        .readdirSync(directory)
        .filter(file => /\.ya?ml$/.test(file))
        .map(file => [file, YAML.parse(fs.readFileSync(path.join(directory, file), "utf8"))])
    );
  }

  test("actual workflows are consistent and use trusted notification code", () => {
    const workflows = readWorkflows();
    expect(() => validateWorkflows(workflows)).not.toThrow();
    const notifier = workflows["action-failure-slack-notification.yml"];
    const condition = notifier.jobs.notify.if;
    const match = condition.match(/fromJSON\('([^']+)'\)/);
    expect(JSON.parse(match[1])).toEqual(FAILURE_CONCLUSIONS);
    expect(condition).toContain("head_repository.full_name == github.repository");
    expect(notifier.on.workflow_run.branches).toEqual(["main", "release"]);
    expect(notifier.permissions).toEqual({ contents: "read" });
    expect(notifier.jobs.notify.steps[0].with).toEqual({
      ref: "${{ github.workflow_sha }}",
      "persist-credentials": false,
    });
  });

  test.each(["addition", "rename", "removal", "duplicate", "exclusion"])(
    "detects workflow %s",
    scenario => {
      const workflows = readWorkflows();
      if (scenario === "addition") workflows["new.yml"] = { name: "New Quality Gate" };
      if (scenario === "rename") workflows["build.yml"].name = "Renamed Build";
      if (scenario === "removal") delete workflows["build.yml"];
      if (scenario === "duplicate") workflows["new.yml"] = { name: "Build Test" };
      if (scenario === "exclusion") {
        workflows["action-failure-slack-notification.yml"].on.workflow_run.workflows.push(
          "Wiki Slack Notification"
        );
      }
      expect(() => validateWorkflows(workflows)).toThrow();
    }
  );
});

describe("Wiki notification compatibility", () => {
  test("retains page actions, escaping and compare links", () => {
    const message = wiki.buildSlackMessage({
      actor: "test-user",
      trigger: "gollum",
      pages: [
        {
          title: "A<B|C>",
          action: "edited",
          html_url: "https://example.invalid/wiki",
          compareUrl: "https://example.invalid/compare",
        },
      ],
    });
    expect(message).toContain("Wiki が更新されました");
    expect(message).toContain("A＜B｜C＞");
    expect(message).toContain("操作: edited");
    expect(message).toContain("Compare: https://example.invalid/compare");
  });
});

describe("Notification entry points", () => {
  const originalEnvironment = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env = { ...originalEnvironment };
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function prepare(event) {
    process.env.GITHUB_EVENT_PATH = "/mock-event.json";
    process.env.GITHUB_REPOSITORY = "example/portal";
    process.env.SLACK_WEBHOOK_URL = "https://example.invalid/webhook";
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(event));
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  }

  test.each(FAILURE_CONCLUSIONS)(
    "Actions entry point sends %s via shared helper",
    async conclusion => {
      prepare({ workflow_run: { ...run, conclusion } });
      await require("../../scripts/action-failure-slack-notification.cjs").main();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(JSON.parse(global.fetch.mock.calls[0][1].body).text).toContain(`結果: ${conclusion}`);
    }
  );

  test("Actions entry point skips a successful run", async () => {
    prepare({ workflow_run: { ...run, conclusion: "success" } });
    await require("../../scripts/action-failure-slack-notification.cjs").main();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("Wiki entry point preserves payload and sends via shared helper", async () => {
    prepare({
      sender: { login: "editor" },
      pages: [
        {
          title: "Home",
          action: "edited",
          html_url: "https://example.invalid/wiki/Home",
          sha: "abc123",
        },
        {
          page_name: "New Page",
          action: "created",
          html_url: "https://example.invalid/wiki/New-Page",
        },
      ],
    });
    process.env.GITHUB_EVENT_NAME = "gollum";
    await wiki.main();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const message = JSON.parse(global.fetch.mock.calls[0][1].body).text;
    expect(message).toContain("更新者: editor");
    expect(message).toContain("トリガー: gollum");
    expect(message).toContain("https://github.com/example/portal/wiki/_compare/abc123");
    expect(message).toContain("New Page");
    expect(message).toContain("操作: created");
  });

  test("Wiki entry point skips empty page events", async () => {
    prepare({ pages: [] });
    jest.spyOn(process.stdout, "write").mockReturnValue(true);
    await wiki.main();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("both entry points propagate webhook errors", async () => {
    prepare({ workflow_run: run, pages: [{ title: "Home" }] });
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(wiki.main()).rejects.toThrow("Slack notification failed: 500");
    await expect(
      require("../../scripts/action-failure-slack-notification.cjs").main()
    ).rejects.toThrow("Slack notification failed: 500");
  });
});

describe("Slack webhook", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("sends JSON without changing the message", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await sendSlackNotification("https://example.invalid/webhook", '通知 "test"');
    expect(global.fetch).toHaveBeenCalledWith("https://example.invalid/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: '通知 "test"' }),
      signal: expect.any(AbortSignal),
    });
  });

  test("rejects when the request timeout aborts fetch", async () => {
    const controller = new AbortController();
    const timeout = jest.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    global.fetch = jest.fn(
      (_url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), { once: true });
        })
    );

    const request = sendSlackNotification("https://example.invalid/webhook", "test");
    controller.abort(new DOMException("The operation timed out", "TimeoutError"));

    await expect(request).rejects.toMatchObject({ name: "TimeoutError" });
    expect(timeout).toHaveBeenCalledWith(10_000);
    expect(global.fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });

  test("rejects a missing secret without sending", async () => {
    global.fetch = jest.fn();
    await expect(sendSlackNotification("", "test")).rejects.toThrow("SLACK_WEBHOOK_URL");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("propagates HTTP errors without logging the response body", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });
    await expect(sendSlackNotification("https://example.invalid", "test")).rejects.toThrow(
      "Slack notification failed: 403"
    );
  });
});

describe("Dependabot notification", () => {
  const originalFetch = global.fetch;
  const now = new Date("2026-11-23T02:00:00Z");
  const dependabotPr = {
    user: { login: "dependabot[bot]" },
    title: "Bump <next> | group",
    html_url: "https://github.com/example/portal/pull/1",
    created_at: "2026-11-20T02:00:00Z",
  };
  const humanPr = { ...dependabotPr, user: { login: "someone" }, title: "Human PR" };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function prepare(pullRequests) {
    process.env.GITHUB_REPOSITORY = "example/portal";
    process.env.GITHUB_TOKEN = "token";
    process.env.SLACK_WEBHOOK_URL = "https://example.invalid/webhook";
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => pullRequests })
      .mockResolvedValue({ ok: true });
  }

  test("keeps only Dependabot pull requests", () => {
    expect(dependabot.filterDependabotPullRequests([dependabotPr, humanPr])).toEqual([
      dependabotPr,
    ]);
  });

  test("builds a message with escaped titles and age in days", () => {
    const message = dependabot.buildSlackMessage([dependabotPr], now);
    expect(message).toContain("未対応の Dependabot PR が 1 件あります");
    expect(message).toContain(
      "<https://github.com/example/portal/pull/1|Bump ＜next＞ ｜ group>（作成から 3 日）"
    );
  });

  test("entry point lists open pull requests and sends one notification", async () => {
    prepare([dependabotPr, humanPr]);
    await dependabot.main();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toContain("/repos/example/portal/pulls?state=open");
    const message = JSON.parse(global.fetch.mock.calls[1][1].body).text;
    expect(message).toContain("1 件");
    expect(message).not.toContain("Human PR");
  });

  test("entry point skips when there are no Dependabot pull requests", async () => {
    prepare([humanPr]);
    jest.spyOn(process.stdout, "write").mockReturnValue(true);
    await dependabot.main();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("entry point propagates GitHub API errors", async () => {
    prepare([]);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });
    await expect(dependabot.main()).rejects.toThrow("GitHub API request failed: 403");
  });
});
