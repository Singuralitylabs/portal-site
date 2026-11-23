const fs = require("node:fs");
const { sendSlackNotification } = require("./slack-webhook.cjs");

const DEPENDABOT_ACTOR = "dependabot[bot]";

// Slack リンク記法で崩れる文字を表示用テキストで安全な全角文字へ置き換える。
function escapeSlackLinkText(text) {
  const replacements = { "<": "＜", ">": "＞", "|": "｜" };
  return String(text).replace(/[<>|]/g, character => replacements[character]);
}

// Dependabot が作成した PR だけを通知対象にする。
function shouldNotify(pullRequest) {
  return pullRequest?.user?.login === DEPENDABOT_ACTOR;
}

// Slack Incoming Webhook に送るプレーンテキスト本文を整形する。
function buildSlackMessage(pullRequest) {
  return [
    "Dependabot の更新PRが作成されました",
    "",
    `- PR: <${pullRequest.html_url}|${escapeSlackLinkText(pullRequest.title)}>`,
    "- 対応: CI の結果を確認してレビュー・マージしてください",
  ].join("\n");
}

async function main() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "SLACK_WEBHOOK_URL が設定されていません。GitHub Actions Secrets を確認してください。"
    );
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath || !fs.existsSync(eventPath)) {
    throw new Error("GITHUB_EVENT_PATH が見つかりません。");
  }

  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));

  if (!shouldNotify(event.pull_request)) {
    process.stdout.write("Dependabot の PR ではないため、通知をスキップします。\n");
    return;
  }

  await sendSlackNotification(webhookUrl, buildSlackMessage(event.pull_request));
}

module.exports = { shouldNotify, buildSlackMessage, main };

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
