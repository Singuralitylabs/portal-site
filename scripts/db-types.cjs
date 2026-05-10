const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// .env ファイルを読み込んで環境変数に設定する関数
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2];

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// コマンドを実行して結果を返す関数。エラーがあればプロセスを終了する。
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: ["inherit", "pipe", "pipe"],
    encoding: "utf8",
    ...options,
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }

  return result;
}

// プロジェクトルートを基準に .env.local を読み込む
const projectRoot = path.resolve(__dirname, "..");
loadDotEnv(path.join(projectRoot, ".env.local"));
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

// SUPABASE_PROJECT_ID を環境変数から取得。存在しない場合はエラーを出して終了する。
const projectId = process.env.SUPABASE_PROJECT_ID;
if (!projectId) {
  console.error("SUPABASE_PROJECT_ID is not set.");
  process.exit(1);
}

// Supabase CLI を使って TypeScript の型定義を生成する。生成されたコードは app/types/lib/database.types.ts に保存する。
const generated = run(npxCmd, [
  "supabase",
  "gen",
  "types",
  "--lang=typescript",
  "--project-id",
  projectId,
  "--schema",
  "public",
]);

const outputPath = path.join(projectRoot, "app/types/lib/database.types.ts");
fs.writeFileSync(outputPath, generated.stdout ?? "", "utf8");

// 生成されたコードを Prettier で整形する
run(npxCmd, ["prettier", "--write", outputPath], {
  stdio: "inherit",
});
