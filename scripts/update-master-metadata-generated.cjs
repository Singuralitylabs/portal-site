// docs/database.md から master 参照画面用の自動生成 metadata を生成するスクリプト。
// 対象テーブルのカラム一覧や表示ラベルを抽出し、app/constants/master-metadata.generated.ts へ反映する。

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const docsPath = path.join(projectRoot, "docs/database.md");
const outputPath = path.join(projectRoot, "app/constants/master-metadata.generated.ts");
const isCheckMode = process.argv.includes("--check");
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const TARGET_TABLES = ["documents", "videos", "categories", "applications", "positions"];

const TABLE_LABELS = {
  documents: "資料",
  videos: "動画",
  categories: "カテゴリー",
  applications: "アプリ",
  positions: "役職",
};

const COLUMN_LABELS = {
  id: "ID",
  name: {
    documents: "資料名",
    videos: "動画名",
    categories: "カテゴリー名",
    applications: "アプリ名",
    positions: "役職名",
  },
  description: "説明",
  category_id: "カテゴリー",
  category_type: "カテゴリー種別",
  url: "URL",
  display_order: "表示順",
  created_by: "作成者",
  updated_by: "更新者",
  assignee: "担当者名",
  assignee_id: "担当者",
  developer_id: "開発者",
  thumbnail_path: "サムネイルパス",
  thumbnail_time: "サムネイル時刻",
  length: "動画時間",
  is_deleted: "削除状態",
  created_at: "作成日時",
  updated_at: "更新日時",
};

// docs/database.md を読み、master 参照用の自動生成 metadata を生成または整合性確認する。
function main() {
  const source = fs.readFileSync(docsPath, "utf8");
  const sections = extractTableSections(source);
  const tables = TARGET_TABLES.map(tableName =>
    buildGeneratedTable(tableName, sections[tableName])
  );
  const generatedSource = formatWithPrettier(renderGeneratedMetadataSource(tables));

  if (isCheckMode) {
    const currentSource = fs.readFileSync(outputPath, "utf8");
    if (currentSource !== generatedSource) {
      throw new Error(
        "app/constants/master-metadata.generated.ts が最新ではありません。npm run master:metadata を実行してください。"
      );
    }
    process.stdout.write("app/constants/master-metadata.generated.ts は最新です。\n");
    return;
  }

  fs.writeFileSync(outputPath, generatedSource, "utf8");
  process.stdout.write("app/constants/master-metadata.generated.ts を更新しました。\n");
}

// 対象 5 テーブルの見出し位置を基準に、各 markdown テーブル本文だけを抽出する。
function extractTableSections(source) {
  const sections = {};
  const headingMatches = Array.from(source.matchAll(/^###\s+\d+\.\d+\.\s+(\w+)\s+テーブル$/gm)).map(
    match => ({
      tableName: match[1],
      index: match.index,
      headingText: match[0],
    })
  );

  for (const tableName of TARGET_TABLES) {
    const currentHeadingIndex = headingMatches.findIndex(match => match.tableName === tableName);
    if (currentHeadingIndex === -1) {
      throw new Error(
        `docs/database.md から ${tableName} テーブルのセクションを見つけられませんでした。`
      );
    }

    const currentHeading = headingMatches[currentHeadingIndex];
    const sectionStart = currentHeading.index + currentHeading.headingText.length + 1;
    const nextHeading = headingMatches[currentHeadingIndex + 1];
    const sectionEnd = nextHeading ? nextHeading.index : source.length;

    sections[tableName] = parseMarkdownTable(source.slice(sectionStart, sectionEnd));
  }

  return sections;
}

// 抽出した markdown テーブルを列単位の中間表現へ変換する。
function parseMarkdownTable(sectionBody) {
  const lines = sectionBody
    .split("\n")
    .map(line => line.trimEnd())
    .filter(line => line.startsWith("|"));

  if (lines.length < 3) {
    throw new Error("Markdown テーブルを解析できませんでした。");
  }

  return lines.slice(2).map(line => {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map(cell => cell.trim());

    if (cells.length < 4) {
      throw new Error(`Markdown テーブル行の列数が不足しています: ${line}`);
    }

    const [columnKey, dataType, constraints, ...descriptionParts] = cells;

    return {
      columnKey: stripCode(columnKey),
      dataType: stripCode(dataType),
      constraints,
      description: stripCode(descriptionParts.join(" | ")),
    };
  });
}

// markdown 上のコード記法を外し、比較や生成に使う素の文字列へ正規化する。
function stripCode(value) {
  return value.replace(/`/g, "").trim();
}

// 1 テーブル分の行情報から、詳細表示順・表示ラベル・参照定義を持つ自動生成 metadata を組み立てる。
function buildGeneratedTable(tableName, rows) {
  if (!rows || rows.length === 0) {
    throw new Error(`docs/database.md から ${tableName} テーブルを解析できませんでした。`);
  }

  return {
    tableName,
    label: TABLE_LABELS[tableName],
    detailColumnKeys: rows.map(row => row.columnKey),
    labels: Object.fromEntries(
      rows.map(row => [row.columnKey, resolveColumnLabel(tableName, row)])
    ),
    references: rows
      .map(row => {
        const referenceType = resolveReferenceType(row.constraints);
        if (!referenceType) {
          return null;
        }

        return {
          columnKey: row.columnKey,
          type: referenceType,
        };
      })
      .filter(Boolean),
  };
}

// docs の説明文を master 画面向けの短い表示ラベルへ寄せる。
function resolveColumnLabel(tableName, row) {
  const predefined = COLUMN_LABELS[row.columnKey];
  if (typeof predefined === "string") {
    return predefined;
  }

  if (predefined && typeof predefined === "object" && predefined[tableName]) {
    return predefined[tableName];
  }

  const compact = row.description
    .replace(/^（廃止）/, "")
    .replace(/（.*?）/g, "")
    .replace(/レコードの一意な識別子（連番）/g, "ID")
    .replace(/を最後に更新したユーザー/g, "更新者")
    .replace(/を作成したユーザー/g, "作成者")
    .replace(/の責任者ユーザー（あるいは窓口）/g, "担当者")
    .replace(/の責任者ユーザー/g, "担当者")
    .replace(/の担当者名（講師など）/g, "担当者名")
    .replace(/の担当者名/g, "担当者名")
    .replace(/のカテゴリー/g, "カテゴリー")
    .replace(/の分類/g, "カテゴリー")
    .replace(/の詳細説明文/g, "説明")
    .replace(/の説明文/g, "説明")
    .replace(/役職・所属名/g, "役職名")
    .trim();

  return compact || row.columnKey;
}

// 制約文字列から master 画面で解決すべき参照種別を推定する。
function resolveReferenceType(constraints) {
  if (constraints.includes("FOREIGN KEY(categories.id)")) {
    return "category";
  }

  if (constraints.includes("FOREIGN KEY(users.id)")) {
    return "user";
  }

  return null;
}

// 自動生成 metadata ファイル全体の TypeScript ソースを構築する。
function renderGeneratedMetadataSource(tables) {
  const tableNames = tables.map(table => `  | "${table.tableName}"`).join("\n");
  const tableBlocks = tables
    .map(table => {
      return `  {
    tableName: "${table.tableName}",
    label: "${table.label}",
    detailColumnKeys: ${renderStringArray(table.detailColumnKeys)},
    labels: ${renderRecord(table.labels)},
    references: ${renderObjectArray(table.references, ["columnKey", "type"])}
  }`;
    })
    .join(",\n");

  return `export type GeneratedMasterMetadataTableName =\n${tableNames};

export type GeneratedMasterMetadataReferenceType = "category" | "user";

export type GeneratedMasterMetadataReference = {
  columnKey: string;
  type: GeneratedMasterMetadataReferenceType;
};

export type GeneratedMasterMetadataTable = {
  tableName: GeneratedMasterMetadataTableName;
  label: string;
  detailColumnKeys: readonly string[];
  labels: Record<string, string>;
  references: readonly GeneratedMasterMetadataReference[];
};

// このファイルは scripts/update-master-metadata-generated.cjs により自動生成されます。
// 直接編集せず、docs/database.md を更新して npm run master:metadata を再実行してください。
export const GENERATED_MASTER_METADATA: readonly GeneratedMasterMetadataTable[] = [
${tableBlocks},
];
`;
}

// TypeScript 出力用に文字列配列を整形する。
function renderStringArray(values) {
  if (values.length === 0) {
    return "[]";
  }

  return `[
      ${values.map(value => `"${value}"`).join(",\n      ")}
    ]`;
}

// TypeScript 出力用にラベル定義の record を整形する。
function renderRecord(record) {
  const entries = Object.entries(record);
  if (entries.length === 0) {
    return "{}";
  }

  return `{
      ${entries.map(([key, value]) => `${key}: "${value}"`).join(",\n      ")}
    }`;
}

// TypeScript 出力用に参照定義などの object 配列を整形する。
function renderObjectArray(values, keys) {
  if (values.length === 0) {
    return "[]";
  }

  return `[
      ${values
        .map(value => `{ ${keys.map(key => `${key}: "${value[key]}"`).join(", ")} }`)
        .join(",\n      ")}
    ]`;
}

// 生成した TypeScript を Prettier に通し、リポジトリの既存スタイルへ揃える。
function formatWithPrettier(source) {
  const result = spawnSync(
    npxCmd,
    ["prettier", "--parser", "typescript", "--filepath", outputPath],
    {
      input: source,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || "Prettier の整形に失敗しました。");
  }

  return result.stdout;
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
