#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

// コミット対象の暗号化 env ファイル。ここに含まれる値はすべて dotenvx で
// 暗号化（`encrypted:` で始まる）されている必要がある。公開リポジトリに
// 平文の秘密情報が誤ってコミットされることを CI で防ぐためのチェック。
const TARGET_FILE = path.resolve(__dirname, "..", ".env.development");

// 平文で保持してよいキー。dotenvx の公開鍵は仕様上、平文で `.env.development`
// に書き込まれる（秘密情報ではない）。平文で扱いたい非機密キーを追加する場合は
// ここに明示的に列挙する。
const PLAINTEXT_ALLOW_KEYS = new Set(["DOTENV_PUBLIC_KEY_DEVELOPMENT"]);

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function main() {
  const rel = path.relative(process.cwd(), TARGET_FILE);

  if (!fs.existsSync(TARGET_FILE)) {
    console.error(`NG! ${rel} が見つかりません。`);
    process.exit(1);
  }

  const content = fs.readFileSync(TARGET_FILE, "utf8");
  const lines = content.split(/\r?\n/);
  const assignment = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

  const violations = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return;

    const match = line.match(assignment);
    if (!match) return; // 代入行でなければ対象外

    const [, key, rawValue] = match;
    if (PLAINTEXT_ALLOW_KEYS.has(key)) return;

    const value = stripQuotes(rawValue);
    if (!value.startsWith("encrypted:")) {
      violations.push({ line: index + 1, key });
    }
  });

  if (violations.length > 0) {
    console.error(
      `NG! ${rel} に暗号化されていない値があります。\n` +
        `\`npx dotenvx encrypt -f .env.development\` で暗号化してからコミットしてください。`
    );
    violations.forEach(({ line, key }) => {
      console.error(
        `${rel}:${line}: ${key} の値が暗号化されていません（encrypted: で始まっていません）`
      );
    });
    process.exit(1);
  }

  console.log(`OK! ${rel} の値はすべて暗号化されています。`);
}

main();
