const fs = require("fs");
const path = require("path");

const isCheck = process.argv.includes("--check");
const docsRoot = path.resolve(process.cwd(), "docs");

function getMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeTableLine(line) {
  const match = line.match(/^(\s*)(\|.*)$/);
  if (!match) {
    return line;
  }

  const indent = match[1];
  const tablePart = match[2];

  const cells = tablePart
    .split("|")
    .slice(1, -1)
    .map(cell => cell.trim());

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

function normalizeMarkdown(content) {
  const normalizedSource = content.replace(/\n+$/g, "");
  const lines = normalizedSource.split("\n");
  let inFence = false;
  let inTextFence = false;

  const normalized = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim().toLowerCase();
      if (!inFence) {
        inFence = true;
        inTextFence = lang === "text";
      } else {
        inFence = false;
        inTextFence = false;
      }
      return line;
    }

    if (inFence || inTextFence) {
      return line;
    }

    // hard line break 用の行末2スペースは保持する
    const trailing = line.match(/[ \t]+$/);
    const trailingSpaces = trailing ? trailing[0] : "";
    const hasHardBreak = trailingSpaces.length >= 2;
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

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const formatted = normalizeMarkdown(original);

  if (original !== formatted) {
    hasDiff = true;
    if (!isCheck) {
      fs.writeFileSync(file, formatted, "utf8");
      const rel = path.relative(process.cwd(), file);
      console.log(`${rel}: normalized`);
    }
  }
}

if (isCheck && hasDiff) {
  console.error("docs markdown normalization is required.");
  process.exit(1);
}

if (isCheck && !hasDiff) {
  console.log("docs markdown normalization: no issues found");
}
