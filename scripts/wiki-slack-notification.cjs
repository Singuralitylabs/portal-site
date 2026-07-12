const fs = require("fs");
const REPOSITORY_OWNER = "Singuralitylabs";
const REPOSITORY_NAME = "portal-site";

// Slack リンク記法で崩れる文字を表示用テキストから除去する。
function escapeSlackLinkText(text) {
  return String(text).replace(/[<>|]/g, character => {
    if (character === "<") {
      return "＜";
    }

    if (character === ">") {
      return "＞";
    }

    return "｜";
  });
}

// 比較画面へのリンクをコミット SHA から組み立てる。
function buildCompareUrl(revision) {
  if (!revision) {
    return null;
  }

  return `https://github.com/${REPOSITORY_OWNER}/${REPOSITORY_NAME}/wiki/_compare/${revision}`;
}

// gollum 実行時はイベント payload から通知情報を組み立てる。
function createPages(event) {
  return (event.pages || []).map(page => {
    const title = page.title || page.page_name || "Untitled";

    return {
      title,
      action: page.action || "edited",
      html_url: page.html_url,
      compareUrl: buildCompareUrl(page.sha),
    };
  });
}

// Slack Incoming Webhook に送るプレーンテキスト本文を整形する。
function buildSlackMessage({ actor, trigger, pages }) {
  const lines = [
    "Wiki が更新されました",
    "",
    `- 更新者: ${actor || "unknown"}`,
    `- トリガー: ${trigger}`,
    "",
  ];

  for (const page of pages) {
    lines.push(`- ページ: <${page.html_url}|${escapeSlackLinkText(page.title)}>`);
    lines.push(`  操作: ${page.action}`);

    if (page.compareUrl) {
      lines.push(`  Compare: ${page.compareUrl}`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

// 組み立てた本文を Slack Incoming Webhook へ送信する。
async function sendSlackNotification(webhookUrl, message) {
  const payload = { text: message };
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack notification failed: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  // Secret とイベント payload の存在を先に検証し、実行失敗理由を明確にする。
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

  // 実行トリガーに応じて通知対象ページの組み立て方法を切り替える。
  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const eventName = process.env.GITHUB_EVENT_NAME || "gollum";
  const pages = createPages(event);

  if (pages.length === 0) {
    throw new Error("通知対象の Wiki ページが見つかりませんでした。");
  }

  // ページ一覧を 1 件の通知本文にまとめて Slack へ送る。
  const message = buildSlackMessage({
    actor: event.sender?.login || process.env.GITHUB_ACTOR || "unknown",
    trigger: eventName,
    pages,
  });

  await sendSlackNotification(webhookUrl, message);
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
