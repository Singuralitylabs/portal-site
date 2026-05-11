const fs = require("fs");
const path = require("path");

const isCheck = process.argv.includes("--check");
const docsRoot = path.resolve(process.cwd(), "docs");

if (!fs.existsSync(docsRoot)) {
  console.error(`docs ディレクトリが見つかりません: ${docsRoot}`);
  process.exit(1);
}

// docs 配下の Markdown ファイルを再帰的に収集する
function getMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  // ディレクトリを走査して .md ファイルだけを収集する
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // 子ディレクトリは再帰的に探索する
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
      continue;
    }
    // Markdown ファイルのみ対象にする
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

// 表の 1 行を正規化し、区切り行は --- 形式に統一する
function normalizeTableLine(line) {
  const match = line.match(/^(\s*)(\|.*)$/);
  // 表形式でない行はそのまま返す
  if (!match) {
    return line;
  }

  const indent = match[1];
  const tablePart = match[2];
  const hasTrailingPipe = tablePart.endsWith("|");
  const tableBody = hasTrailingPipe ? tablePart.slice(1, -1) : tablePart.slice(1);

  const cells = tableBody.split("|").map(cell => cell.trim());

  // セルがない場合は変換しない
  if (cells.length === 0) {
    return line;
  }

  const delimiterOnly = cells.every(cell => /^:?-{2,}:?$/.test(cell));

  if (delimiterOnly) {
    const normalized = cells.map(cell => {
      const startColon = cell.startsWith(":");
      const endColon = cell.endsWith(":");
      return ` ${startColon ? ":" : ""}---${endColon ? ":" : ""} `;
    });
    return `${indent}|${normalized.join("|")}|`;
  }

  const normalized = cells.map(cell => ` ${cell} `);
  return `${indent}|${normalized.join("|")}|`;
}

// Markdown 全体を要件に沿って正規化する
function normalizeMarkdown(content) {
  const normalizedSource = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n+$/g, "");
  const lines = normalizedSource.split("\n");
  let inFence = false;

  const normalized = lines.map(line => {
    const trimmed = line.trim();
    // コードフェンスの内外を判定し、全フェンス内は変換しない
    if (trimmed.startsWith("```")) {
      if (!inFence) {
        inFence = true;
      } else {
        inFence = false;
      }
      return line;
    }

    // フェンス内はそのまま保持する
    if (inFence) {
      return line;
    }

    // hard line break 用の行末2スペースは保持する
    const trailing = line.match(/[ \t]+$/);
    const trailingSpaces = trailing ? trailing[0] : "";
    const hasHardBreak = / {2,}$/.test(trailingSpaces);
    let next = trailing ? line.slice(0, -trailingSpaces.length) : line;

    // 全文で不要な underscore エスケープを除去
    next = next.replace(/\\_/g, "_");

    // 箇条書き内の [ に付与された不要エスケープを除去
    if (/^\s*(?:[-*+]\s|\d+\.\s)/.test(next)) {
      next = next.replace(/\\\[/g, "[");
    }

    // 区切り線は --- を維持（*** への変換は行わない）
    next = normalizeTableLine(next);
    if (trailingSpaces) {
      next += hasHardBreak ? "  " : trailingSpaces;
    }
    return next;
  });

  return `${normalized.join("\n")}\n`;
}

const files = getMarkdownFiles(docsRoot);
let hasDiff = false;
const diffFiles = [];

// 差分があるファイルを検出し、必要に応じて上書きする
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const formatted = normalizeMarkdown(original);

  // 変換結果に差分がある場合のみ処理する
  if (original !== formatted) {
    hasDiff = true;
    const rel = path.relative(process.cwd(), file);
    diffFiles.push(rel);
    // チェックモード以外ではファイルを書き換える
    if (!isCheck) {
      fs.writeFileSync(file, formatted, "utf8");
      console.log(`${rel}: 正規化しました`);
    }
  }
}

if (isCheck && hasDiff) {
  console.error("docs の Markdown 正規化が必要です。");
  for (const file of diffFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

if (isCheck && !hasDiff) {
  console.log("docs の Markdown 正規化: 問題はありません");
}
