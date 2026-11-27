const { sendSlackNotification } = require("./slack-webhook.cjs");

const DEPENDABOT_ACTOR = "dependabot[bot]";
const GITHUB_API_TIMEOUT_MS = 10_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Slack リンク記法で崩れる文字を表示用テキストで安全な全角文字へ置き換える。
function escapeSlackLinkText(text) {
  const replacements = { "<": "＜", ">": "＞", "|": "｜" };
  return String(text).replace(/[<>|]/g, character => replacements[character]);
}

// Dependabot が作成した PR だけを抽出する。
function filterDependabotPullRequests(pullRequests) {
  return pullRequests.filter(pullRequest => pullRequest?.user?.login === DEPENDABOT_ACTOR);
}

// Slack Incoming Webhook に送るプレーンテキスト本文を整形する。
function buildSlackMessage(pullRequests, now = new Date()) {
  const lines = [`未対応の Dependabot PR が ${pullRequests.length} 件あります`, ""];

  for (const pullRequest of pullRequests) {
    const days = Math.max(0, Math.floor((now - new Date(pullRequest.created_at)) / MS_PER_DAY));
    lines.push(
      `- <${pullRequest.html_url}|${escapeSlackLinkText(pullRequest.title)}>（作成から ${days} 日）`
    );
  }

  lines.push("", "CI の結果を確認して、レビュー・マージしてください。");

  return lines.join("\n");
}

// オープン中の PR を取得する。schedule 実行では通常の GITHUB_TOKEN（pull-requests: read）を使う。
async function fetchOpenPullRequests(repository, token) {
  const pullRequests = [];

  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/pulls?state=open&per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(GITHUB_API_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`);
    }

    const items = await response.json();
    pullRequests.push(...items);

    if (items.length < 100) {
      break;
    }
  }

  return pullRequests;
}

async function main() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "SLACK_WEBHOOK_URL が設定されていません。GitHub Actions Secrets を確認してください。"
    );
  }

  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;

  if (!repository || !token) {
    throw new Error("GITHUB_REPOSITORY または GITHUB_TOKEN が見つかりません。");
  }

  const pullRequests = filterDependabotPullRequests(await fetchOpenPullRequests(repository, token));

  if (pullRequests.length === 0) {
    process.stdout.write("未対応の Dependabot PR がないため、通知をスキップします。\n");
    return;
  }

  await sendSlackNotification(webhookUrl, buildSlackMessage(pullRequests));
}

module.exports = { filterDependabotPullRequests, buildSlackMessage, main };

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
