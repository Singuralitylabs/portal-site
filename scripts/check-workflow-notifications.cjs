const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const NOTIFIER = "action-failure-slack-notification.yml";
const EXCLUSIONS = {
  "action-failure-slack-notification.yml": "Actions Failure Slack Notification",
  "wiki-slack-notification.yml": "Wiki Slack Notification",
};

function validateWorkflows(workflows) {
  const targets = workflows[NOTIFIER]?.on?.workflow_run?.workflows;
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error("Notification workflow must declare monitored workflow names.");
  }
  const names = Object.values(workflows).map(workflow => workflow.name);
  if (names.some(name => typeof name !== "string" || !name.trim())) {
    throw new Error("Every workflow must have an explicit name.");
  }
  if (new Set(names).size !== names.length || new Set(targets).size !== targets.length) {
    throw new Error("Workflow names and notification targets must be unique.");
  }
  for (const [file, name] of Object.entries(EXCLUSIONS)) {
    if (workflows[file]?.name !== name || targets.includes(name)) {
      throw new Error(`Notification exclusion changed: ${file}`);
    }
  }
  const expected = Object.entries(workflows)
    .filter(([file]) => !Object.hasOwn(EXCLUSIONS, file))
    .map(([, workflow]) => workflow.name);
  const missing = expected.filter(name => !targets.includes(name));
  const stale = targets.filter(name => !expected.includes(name));
  if (missing.length || stale.length) {
    throw new Error(
      `Update notification targets. Missing: ${missing.join(", ")}; stale: ${stale.join(", ")}`
    );
  }
}

function main() {
  const directory = path.join(__dirname, "../.github/workflows");
  const workflows = Object.fromEntries(
    fs
      .readdirSync(directory)
      .filter(file => /\.ya?ml$/.test(file))
      .map(file => [file, YAML.parse(fs.readFileSync(path.join(directory, file), "utf8"))])
  );
  validateWorkflows(workflows);
  process.stdout.write("Workflow notification targets are consistent.\n");
}

module.exports = { validateWorkflows, main };

if (require.main === module) {
  main();
}
