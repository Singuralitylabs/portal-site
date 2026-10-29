const fs = require("node:fs");
const { sendSlackNotification } = require("./slack-webhook.cjs");

const FAILURE_CONCLUSIONS = ["failure", "timed_out", "startup_failure"];

function shouldNotify(run, repository) {
  return (
    Boolean(repository) &&
    run?.head_repository?.full_name === repository &&
    ["main", "release"].includes(run.head_branch) &&
    FAILURE_CONCLUSIONS.includes(run.conclusion)
  );
}

function buildSlackMessage(run) {
  return [
    "GitHub Actions のワークフローが異常終了しました",
    "",
    `- ワークフロー: ${run.name}`,
    `- ブランチ: ${run.head_branch}`,
    `- 結果: ${run.conclusion}`,
    `- 実行回数: ${run.run_attempt}`,
    `- トリガー: ${run.event}`,
    `- コミット: ${run.head_sha}`,
    `- 実行URL: ${run.html_url}/attempts/${run.run_attempt}`,
  ].join("\n");
}

async function main() {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  if (!shouldNotify(event.workflow_run, process.env.GITHUB_REPOSITORY)) {
    return;
  }
  await sendSlackNotification(process.env.SLACK_WEBHOOK_URL, buildSlackMessage(event.workflow_run));
}

module.exports = { FAILURE_CONCLUSIONS, shouldNotify, buildSlackMessage, main };

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
