const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MAX_DIFF_LINES = 5;
const MAX_DIFF_CHARACTERS = 100;
const REPOSITORY_OWNER = "Singuralitylabs";
const REPOSITORY_NAME = "portal-site";

// 手動実行入力のページ一覧を改行またはカンマ区切りで正規化する。
function parseUpdatedPagesInput(input) {
  return (input || "")
    .split(/[\n,]/)
    .map(value => value.trim())
    .filter(Boolean);
}

// Wiki URL 用に空白をハイフンへ揃えつつ各パス要素をエンコードする。
function normalizeWikiSlug(title) {
  return title
    .split("/")
    .map(segment => encodeURIComponent(segment.trim().replace(/\s+/g, "-")))
    .join("/");
}

// GitHub Wiki の公開 URL をページタイトルから組み立てる。
function buildWikiPageUrl(title) {
  const normalizedTitle = String(title).replace(/\.md$/i, "");

  return `https://github.com/${REPOSITORY_OWNER}/${REPOSITORY_NAME}/wiki/${normalizeWikiSlug(normalizedTitle)}`;
}

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

// Slack の mrkdwn で意図しないリンク化やメンションを防ぐ。
function escapeSlackText(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 複数行の抜粋を見やすく保つため、各行を同じインデントで整形する。
function formatSlackExcerpt(text) {
  return escapeSlackText(text)
    .split("\n")
    .map(line => `    ${line}`)
    .join("\n");
}

// 比較画面へのリンクをコミット SHA から組み立てる。
function buildCompareUrl(revision) {
  if (!revision) {
    return null;
  }

  return `https://github.com/${REPOSITORY_OWNER}/${REPOSITORY_NAME}/wiki/_compare/${revision}`;
}

// gollum payload のページ情報から Wiki リポジトリ上の Markdown パスを推定する。
function getWikiFilePath(page) {
  if (page.html_url) {
    try {
      const pathname = new URL(page.html_url).pathname;
      const wikiPath = pathname.split("/wiki/")[1];

      if (wikiPath) {
        const decodedPath = decodeURIComponent(wikiPath);
        return decodedPath.endsWith(".md") ? decodedPath : `${decodedPath}.md`;
      }
    } catch {
      // html_url が不正な場合は title/page_name から推定する
    }
  }

  const baseName = (page.title || page.page_name || "").trim().replace(/\s+/g, "-");
  return baseName.endsWith(".md") ? baseName : `${baseName}.md`;
}

// 差分取得に使う git コマンドを wiki リポジトリ配下で実行する。
function runGitCommand(repoPath, args) {
  return execFileSync("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trimEnd();
}

// 更新前後の差分テキストを対象ページ単位で取得する。
function getDiffText(repoPath, revision, filePath) {
  if (!revision || !filePath) {
    return "";
  }

  try {
    return runGitCommand(repoPath, [
      "diff",
      "--unified=0",
      `${revision}^`,
      revision,
      "--",
      filePath,
    ]);
  } catch {
    return "";
  }
}

// Slack 通知で長文になりすぎないよう抜粋文字数を制限する。
function truncateExcerpt(text) {
  if (text.length <= MAX_DIFF_CHARACTERS) {
    return text;
  }

  return `${text.slice(0, MAX_DIFF_CHARACTERS)}...`;
}

// 見出しが取れない場合に備えて追加・削除行から差分抜粋候補を作る。
function getExcerptLines(diffText) {
  return diffText
    .split(/\r?\n/)
    .filter(line => (/^[+-]/.test(line) ? !/^(\+\+\+\s|---\s)/.test(line) : false))
    .map(line => `${line.startsWith("+") ? "追加" : "削除"}: ${line.slice(1).trim()}`)
    .filter(line => line !== "追加: " && line !== "削除: ")
    .slice(0, MAX_DIFF_LINES);
}

// 追加された Markdown 見出しを拾って差分の要点として使う。
function getHeadingsFromDiff(diffText) {
  const headings = diffText
    .split(/\r?\n/)
    .filter(line => line.startsWith("+") && !line.startsWith("+++"))
    .map(line => line.slice(1).trim())
    .filter(line => /^#{1,6}\s+/.test(line))
    .map(line => line.replace(/^#{1,6}\s+/, ""));

  return [...new Set(headings)].slice(0, MAX_DIFF_LINES);
}

// 見出し優先、なければ差分先頭行で Slack 向けの抜粋文を生成する。
function buildExcerptFromDiff(diffText) {
  const headings = getHeadingsFromDiff(diffText);

  if (headings.length > 0) {
    return truncateExcerpt(`見出し: ${headings.join(" / ")}`);
  }

  const excerptLines = getExcerptLines(diffText);

  if (excerptLines.length === 0) {
    return "差分を取得できませんでした。";
  }

  return truncateExcerpt(excerptLines.join("\n"));
}

// workflow_dispatch 実行時は入力値だけで通知対象ページ一覧を構成する。
function createManualPages(inputs) {
  const pageTitles = parseUpdatedPagesInput(inputs.updated_pages);
  const updateSummary = (inputs.update_summary || "").trim();

  return pageTitles.map(title => ({
    title,
    action: "manual",
    html_url: buildWikiPageUrl(title),
    excerpt: updateSummary || "更新概要は指定されていません。",
    compareUrl: null,
  }));
}

// gollum 実行時はイベント payload と git diff から通知情報を組み立てる。
function createGollumPages(event, wikiRepoPath) {
  return (event.pages || []).map(page => {
    const title = page.title || page.page_name || "Untitled";
    const diffText = getDiffText(wikiRepoPath, page.sha, getWikiFilePath(page));

    return {
      title,
      action: page.action || "edited",
      html_url: page.html_url || buildWikiPageUrl(title),
      excerpt: buildExcerptFromDiff(diffText),
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
    lines.push("  差分抜粋:");
    lines.push(formatSlackExcerpt(page.excerpt));

    if (page.compareUrl) {
      lines.push(`  Compare: ${page.compareUrl}`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

// 組み立てた本文を Slack Incoming Webhook へ送信する。
async function sendSlackNotification(webhookUrl, message, channel) {
  const payload = { text: message };

  if (channel) {
    payload.channel = channel;
  }

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
  const eventName = process.env.GITHUB_EVENT_NAME || event.event_name || "unknown";
  const slackChannel = process.env.SLACK_CHANNEL?.trim();
  const wikiRepoPath = process.env.WIKI_REPO_PATH || path.join(process.cwd(), "wiki");
  const pages =
    eventName === "workflow_dispatch"
      ? createManualPages(event.inputs || {})
      : createGollumPages(event, wikiRepoPath);

  if (pages.length === 0) {
    throw new Error("通知対象の Wiki ページが見つかりませんでした。");
  }

  // ページ一覧を 1 件の通知本文にまとめて Slack へ送る。
  const message = buildSlackMessage({
    actor: event.sender?.login || process.env.GITHUB_ACTOR || "unknown",
    trigger: eventName,
    pages,
  });

  await sendSlackNotification(webhookUrl, message, slackChannel);
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
