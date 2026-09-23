// master 参照画面で利用する app/constants/master.ts を生成するスクリプト。
// metadata 定義と database.types.ts を突き合わせ、表示対象カラムや参照定義の整合性も検証する。

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const metadataPath = path.join(projectRoot, "app/constants/master-metadata.ts");
const databaseTypesPath = path.join(projectRoot, "app/types/lib/database.types.ts");
const outputPath = path.join(projectRoot, "app/constants/master.ts");
const isCheckMode = process.argv.includes("--check");
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const transpiledModuleCache = new Map();
const nonFatalWarnings = [];

// metadata と database.types.ts を突き合わせ、master 参照画面で使う定義を生成または整合性確認する。
function main() {
  const metadata = loadTsModule(metadataPath).MASTER_METADATA;
  if (!Array.isArray(metadata) || metadata.length === 0) {
    throw new Error("MASTER_METADATA を読み込めませんでした。");
  }

  const tableColumnsMap = extractTableColumnsFromDatabaseTypes(databaseTypesPath);
  const generatedSource = formatWithPrettier(renderMasterDefinitions(metadata, tableColumnsMap));

  if (isCheckMode) {
    const currentSource = fs.readFileSync(outputPath, "utf8");
    if (currentSource !== generatedSource) {
      throw new Error(
        "app/constants/master.ts が最新ではありません。npm run master:definitions を実行してください。"
      );
    }
    process.stdout.write("app/constants/master.ts は最新です。\n");
    return;
  }

  fs.writeFileSync(outputPath, generatedSource, "utf8");
  process.stdout.write("app/constants/master.ts を更新しました。\n");
}

function reportNonFatalWarning(message) {
  if (!nonFatalWarnings.includes(message)) {
    nonFatalWarnings.push(message);
  }

  process.stdout.write(`[master:definitions] Warning: ${message}\n`);
  if (process.env.GITHUB_ACTIONS === "true") {
    process.stdout.write(`::warning::${message}\n`);
  }
}

// TypeScript の metadata モジュールを CommonJS として評価し、相対 import も含めて読み込む。
function loadTsModule(filePath) {
  const normalizedFilePath = path.resolve(filePath);
  if (transpiledModuleCache.has(normalizedFilePath)) {
    return transpiledModuleCache.get(normalizedFilePath);
  }

  const source = fs.readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filePath,
  });

  const module = { exports: {} };
  transpiledModuleCache.set(normalizedFilePath, module.exports);
  const script = new vm.Script(transpiled.outputText, { filename: filePath });
  const localRequire = request => {
    if (request.startsWith(".")) {
      const resolvedPath = resolveLocalModulePath(path.dirname(filePath), request);
      if (resolvedPath.endsWith(".ts")) {
        return loadTsModule(resolvedPath);
      }
      return require(resolvedPath);
    }

    return require(request);
  };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: localRequire,
    __dirname: path.dirname(filePath),
    __filename: filePath,
    process,
    console,
  });

  script.runInContext(context);
  transpiledModuleCache.set(normalizedFilePath, module.exports);
  return module.exports;
}

// metadata から辿る相対 import を .ts 含めて解決し、script 実行時でも読めるパスに寄せる。
function resolveLocalModulePath(fromDir, request) {
  const candidatePath = path.resolve(fromDir, request);
  const candidates = [
    candidatePath,
    `${candidatePath}.js`,
    `${candidatePath}.cjs`,
    `${candidatePath}.mjs`,
    `${candidatePath}.ts`,
    path.join(candidatePath, "index.js"),
    path.join(candidatePath, "index.ts"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return require.resolve(request, { paths: [fromDir] });
}

// database.types.ts の AST から各テーブルの Row カラム一覧を抜き出す。
function extractTableColumnsFromDatabaseTypes(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const databaseAlias = sourceFile.statements.find(
    statement => ts.isTypeAliasDeclaration(statement) && statement.name.text === "Database"
  );

  if (!databaseAlias || !ts.isTypeLiteralNode(databaseAlias.type)) {
    throw new Error("Database 型定義を解析できませんでした。");
  }

  const publicType = getNestedTypeLiteral(databaseAlias.type, "public");
  const tablesType = getNestedTypeLiteral(publicType, "Tables");
  const result = {};

  for (const member of tablesType.members) {
    if (!ts.isPropertySignature(member) || !member.type) {
      continue;
    }

    const tableName = getPropertyName(member.name);
    const tableType = asTypeLiteral(member.type);
    const rowType = getNestedTypeLiteral(tableType, "Row");

    result[tableName] = rowType.members
      .filter(ts.isPropertySignature)
      .map(property => getPropertyName(property.name));
  }

  return result;
}

// TypeLiteral 内から指定プロパティを辿り、入れ子の型定義を取り出す。
function getNestedTypeLiteral(typeLiteral, propertyName) {
  const property = typeLiteral.members.find(
    member => ts.isPropertySignature(member) && getPropertyName(member.name) === propertyName
  );

  if (!property || !property.type) {
    throw new Error(`${propertyName} の型定義を見つけられませんでした。`);
  }

  return asTypeLiteral(property.type);
}

// TypeScript AST ノードを TypeLiteral として扱える形に正規化する。
function asTypeLiteral(node) {
  if (ts.isTypeLiteralNode(node)) {
    return node;
  }

  if (ts.isParenthesizedTypeNode(node)) {
    return asTypeLiteral(node.type);
  }

  throw new Error("想定外の型定義に遭遇しました。TypeLiteral を期待しています。");
}

// AST 上のプロパティ名を文字列へ変換する。
function getPropertyName(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }

  throw new Error("サポート外のプロパティ名形式です。");
}

// metadata を master.ts の最終出力形へ並べ替え、型定義と定数ブロックをまとめて生成する。
function renderMasterDefinitions(metadata, tableColumnsMap) {
  const normalizedTables = metadata.map(table => normalizeTableMetadata(table, tableColumnsMap));
  const tableNames = normalizedTables.map(table => `"${table.tableName}"`).join(" | ");
  const constNames = normalizedTables.map(table => table.constName).join(",\n  ");
  const constBlocks = normalizedTables.map(renderTableConst).join("\n\n");

  return `import type { Database } from "@/app/types/lib/database.types";

// createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY) と明示しなくても
// 適切なオプションで createClient を自動生成できるようにするための内部型を参照します。
// このファイルは scripts/update-master-definitions.cjs により自動生成されます。
// 直接編集せず、app/constants/master-metadata.ts を更新して npm run master:definitions を再実行してください。

export type MasterTableName = ${tableNames};

export type MasterFieldValue = string | number | boolean | null;

export type MasterTableColumn<T extends MasterTableName> = Extract<
  keyof Database["public"]["Tables"][T]["Row"],
  string
>;

export type MasterReferenceType = "category" | "user";

export type MasterReferenceDefinition<T extends MasterTableName> = {
  columnKey: MasterTableColumn<T>;
  type: MasterReferenceType;
};

export type MasterColumnDefinition<T extends MasterTableName> = {
  key: MasterTableColumn<T>;
  label: string;
};

export type MasterTableDefinition<T extends MasterTableName = MasterTableName> = {
  tableName: T;
  label: string;
  columns: MasterColumnDefinition<T>[];
  listColumnKeys: MasterTableColumn<T>[];
  references: MasterReferenceDefinition<T>[];
};

export type AnyMasterTableDefinition = {
  tableName: MasterTableName;
  label: string;
  columns: { key: string; label: string }[];
  listColumnKeys: string[];
  references: { columnKey: string; type: MasterReferenceType }[];
};

${constBlocks}

export const MASTER_TABLE_DEFINITIONS = [
  ${constNames},
] satisfies AnyMasterTableDefinition[];
`;
}

// 1 テーブル分の metadata を schema と照合し、一覧・詳細で使う columns 定義へ正規化する。
function normalizeTableMetadata(table, tableColumnsMap) {
  const schemaColumns = tableColumnsMap[table.tableName];
  if (!schemaColumns) {
    throw new Error(`database.types.ts に ${table.tableName} テーブルが見つかりません。`);
  }

  const detailColumnKeys = filterKnownKeys(
    `${table.tableName}.detailColumnKeys`,
    table.detailColumnKeys,
    schemaColumns
  );
  const listColumnKeys = filterKnownKeys(
    `${table.tableName}.listColumnKeys`,
    table.listColumnKeys,
    schemaColumns
  );
  const referenceColumnKeys = filterKnownKeys(
    `${table.tableName}.references`,
    table.references.map(reference => reference.columnKey),
    schemaColumns
  );
  const references = table.references.filter(reference =>
    referenceColumnKeys.includes(reference.columnKey)
  );

  const labels = {};
  for (const labeledKey of Object.keys(table.labels)) {
    if (!schemaColumns.includes(labeledKey)) {
      reportNonFatalWarning(
        `${table.tableName}.labels に schema に存在しないカラム ${labeledKey} が含まれているため、このラベル定義は無視します。`
      );
      continue;
    }

    labels[labeledKey] = table.labels[labeledKey];
  }

  const columns = [];
  for (const key of detailColumnKeys) {
    columns.push({ key, label: resolveLabel({ ...table, labels }, key, true) });
  }

  if (table.appendUnknownColumns !== false) {
    for (const key of schemaColumns) {
      if (detailColumnKeys.includes(key)) {
        continue;
      }
      columns.push({ key, label: resolveLabel({ ...table, labels }, key, false) });
    }
  }

  const missingSchemaColumns = schemaColumns.filter(
    key => !columns.some(column => column.key === key)
  );

  if (missingSchemaColumns.length > 0) {
    throw new Error(
      `${table.tableName} テーブルで database.types.ts に存在する列が master.ts の生成対象に不足しています: ${missingSchemaColumns.join(", ")}`
    );
  }

  return {
    ...table,
    labels,
    constName: `${table.tableName.toUpperCase()}_MASTER_TABLE`,
    columns,
    listColumnKeys,
    references,
  };
}

// 明示ラベルを優先し、未知カラムの自動追加時だけカラム名をフォールバックに使う。
function resolveLabel(table, key, isExplicit) {
  const label = table.labels[key];
  if (label) {
    return label;
  }

  if (isExplicit) {
    throw new Error(`${table.tableName}.${key} の表示ラベルが未設定です。`);
  }

  process.stdout.write(
    `[master:definitions] ${table.tableName}.${key} のラベルが未設定のためカラム名をそのまま使用します。\n`
  );
  return key;
}

// metadata に書かれたカラムや参照が schema 上に実在するかを検証する。
function filterKnownKeys(label, keys, schemaColumns) {
  return keys.filter(key => {
    if (schemaColumns.includes(key)) {
      return true;
    }

    reportNonFatalWarning(
      `${label} に schema に存在しないカラム ${key} が含まれているため、この定義はスキップします。`
    );
    return false;
  });
}

// 1 テーブル分の master 定義を satisfies 付きの定数ブロックとして出力する。
function renderTableConst(table) {
  const columns = renderObjectArray(
    table.columns.map(column => ({ key: column.key, label: column.label })),
    ["key", "label"]
  );
  const listColumnKeys = renderStringArray(table.listColumnKeys);
  const references = renderObjectArray(
    table.references.map(reference => ({ columnKey: reference.columnKey, type: reference.type })),
    ["columnKey", "type"]
  );

  return `const ${table.constName} = {
  tableName: "${table.tableName}",
  label: "${table.label}",
  columns: ${columns},
  listColumnKeys: ${listColumnKeys},
  references: ${references},
} satisfies MasterTableDefinition<"${table.tableName}">;`;
}

// TypeScript 出力用に文字列配列を整形する。
function renderStringArray(values) {
  if (values.length === 0) {
    return "[]";
  }

  return `[
    ${values.map(value => `"${value}"`).join(",\n    ")},
  ]`;
}

function renderObjectArray(values, keys) {
  if (values.length === 0) {
    return "[]";
  }

  return `[
    ${values
      .map(value => {
        const parts = keys.map(key => `${key}: "${value[key]}"`);
        return `{ ${parts.join(", ")} }`;
      })
      .join(",\n    ")},
  ]`;
}

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
