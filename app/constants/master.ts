import type { Database } from "@/app/types/lib/database.types";

// マスター管理画面で使う表示定義を、database.types.ts の型で検証しながら静的に保持するファイル。
export type MasterTableName = "documents" | "videos" | "categories" | "applications" | "positions";

// テーブルごとの Relationships 型を取り出し、参照列の型制約に使う。
type TableRelationships<T extends MasterTableName> =
  Database["public"]["Tables"][T]["Relationships"];

// マスター画面で扱う表示値の基本型。
export type MasterFieldValue = string | number | boolean | null;

// 対象テーブルの Row に存在するカラム名だけを許容する型。
export type MasterTableColumn<T extends MasterTableName> = Extract<
  keyof Database["public"]["Tables"][T]["Row"],
  string
>;

// マスター画面で特別扱いする参照先種別。
export type MasterReferenceType = "category" | "user";

// 参照種別ごとに、database.types.ts 上の参照先テーブル名へ対応付ける。
type ReferencedRelationByType = {
  category: "categories";
  user: "users";
};

// Relationships から、参照種別に対応する外部キーカラムだけを取り出す。
type MasterReferenceColumn<
  T extends MasterTableName,
  U extends MasterReferenceType,
> = TableRelationships<T>[number] extends infer Relationship
  ? Relationship extends {
      referencedRelation: ReferencedRelationByType[U];
      columns: readonly (infer Column extends string)[];
    }
    ? Column
    : never
  : never;

// 参照定義は、参照種別と対応する外部キーカラムの組み合わせだけを許容する。
export type MasterReferenceDefinition<T extends MasterTableName> = {
  [U in MasterReferenceType]: {
    columnKey: MasterReferenceColumn<T, U>;
    type: U;
  };
}[MasterReferenceType];

// 画面表示用の 1 カラム定義。
export type MasterColumnDefinition<T extends MasterTableName> = {
  key: MasterTableColumn<T>;
  label: string;
};

// 各テーブルの全カラムに対して表示ラベルを必須化し、追従漏れを型で検知する。
export type MasterLabels<T extends MasterTableName> = Record<MasterTableColumn<T>, string>;

// マスター管理画面で利用する 1 テーブル分の完全な表示定義。
export type MasterTableDefinition<T extends MasterTableName = MasterTableName> = {
  tableName: T;
  label: string;
  labels: MasterLabels<T>;
  columns: MasterColumnDefinition<T>[];
  listColumnKeys: MasterTableColumn<T>[];
  references: MasterReferenceDefinition<T>[];
};

// テーブル横断で扱いやすいように、キー型を緩めた公開用の定義。
export type AnyMasterTableDefinition = {
  tableName: MasterTableName;
  label: string;
  labels: Record<string, string>;
  columns: { key: string; label: string }[];
  listColumnKeys: string[];
  references: { columnKey: string; type: MasterReferenceType }[];
};

// 手書き定義時に入力する最小構成。columns は labels から自動で導出する。
type MasterTableConfig<T extends MasterTableName> = {
  tableName: T;
  label: string;
  labels: MasterLabels<T>;
  listColumnKeys: MasterTableColumn<T>[];
  references: MasterReferenceDefinition<T>[];
};

// labels オブジェクトを、描画側で使いやすい columns 配列へ変換する。
function createMasterColumns<T extends MasterTableName>(
  labels: MasterLabels<T>
): MasterColumnDefinition<T>[] {
  return (Object.entries(labels) as [MasterTableColumn<T>, string][]).map(([key, label]) => ({
    key,
    label,
  }));
}

// 手書きの labels / list / references 定義から、最終的なテーブル定義を組み立てる。
function defineMasterTable<T extends MasterTableName>(
  definition: MasterTableConfig<T>
): MasterTableDefinition<T> {
  return {
    ...definition,
    columns: createMasterColumns(definition.labels),
  };
}

// documents テーブルの表示定義。
const DOCUMENTS_MASTER_TABLE = defineMasterTable({
  tableName: "documents",
  label: "資料",
  labels: {
    id: "ID",
    name: "資料名",
    description: "説明",
    category_id: "カテゴリー",
    url: "URL",
    display_order: "表示順",
    created_by: "作成者",
    updated_by: "更新者",
    assignee: "担当者名",
    assignee_id: "担当者",
    is_deleted: "削除状態",
    created_at: "作成日時",
    updated_at: "更新日時",
  },
  listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  references: [
    { columnKey: "assignee_id", type: "user" },
    { columnKey: "category_id", type: "category" },
    { columnKey: "created_by", type: "user" },
    { columnKey: "updated_by", type: "user" },
  ],
});

// videos テーブルの表示定義。
const VIDEOS_MASTER_TABLE = defineMasterTable({
  tableName: "videos",
  label: "動画",
  labels: {
    id: "ID",
    name: "動画名",
    description: "説明",
    category_id: "カテゴリー",
    url: "URL",
    thumbnail_path: "サムネイルパス",
    thumbnail_time: "サムネイル時刻",
    length: "動画時間",
    display_order: "表示順",
    created_by: "作成者",
    updated_by: "更新者",
    assignee: "担当者名",
    assignee_id: "担当者",
    is_deleted: "削除状態",
    created_at: "作成日時",
    updated_at: "更新日時",
  },
  listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  references: [
    { columnKey: "assignee_id", type: "user" },
    { columnKey: "category_id", type: "category" },
    { columnKey: "created_by", type: "user" },
    { columnKey: "updated_by", type: "user" },
  ],
});

// categories テーブルの表示定義。
const CATEGORIES_MASTER_TABLE = defineMasterTable({
  tableName: "categories",
  label: "カテゴリー",
  labels: {
    id: "ID",
    category_type: "カテゴリー種別",
    name: "カテゴリー名",
    description: "説明",
    display_order: "表示順",
    is_deleted: "削除状態",
    created_at: "作成日時",
    updated_at: "更新日時",
  },
  listColumnKeys: ["id", "category_type", "name", "is_deleted", "updated_at"],
  references: [],
});

// applications テーブルの表示定義。
const APPLICATIONS_MASTER_TABLE = defineMasterTable({
  tableName: "applications",
  label: "アプリ",
  labels: {
    id: "ID",
    name: "アプリ名",
    description: "説明",
    category_id: "カテゴリー",
    url: "URL",
    thumbnail_path: "サムネイルパス",
    developer_id: "開発者",
    display_order: "表示順",
    created_by: "作成者",
    updated_by: "更新者",
    is_deleted: "削除状態",
    created_at: "作成日時",
    updated_at: "更新日時",
  },
  listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  references: [
    { columnKey: "category_id", type: "category" },
    { columnKey: "created_by", type: "user" },
    { columnKey: "developer_id", type: "user" },
    { columnKey: "updated_by", type: "user" },
  ],
});

// positions テーブルの表示定義。
const POSITIONS_MASTER_TABLE = defineMasterTable({
  tableName: "positions",
  label: "役職",
  labels: {
    id: "ID",
    name: "役職名",
    description: "説明",
    display_order: "表示順",
    is_leadership: "役職者フラグ",
    is_deleted: "削除状態",
    created_at: "作成日時",
    updated_at: "更新日時",
  },
  listColumnKeys: ["id", "name", "is_leadership", "is_deleted", "updated_at"],
  references: [],
});

// マスター管理画面で利用する全テーブル定義の一覧。
export const MASTER_TABLE_DEFINITIONS = [
  DOCUMENTS_MASTER_TABLE,
  VIDEOS_MASTER_TABLE,
  CATEGORIES_MASTER_TABLE,
  APPLICATIONS_MASTER_TABLE,
  POSITIONS_MASTER_TABLE,
] satisfies AnyMasterTableDefinition[];
