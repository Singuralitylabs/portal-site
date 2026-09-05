import type { Database } from "@/app/types/lib/database.types";

export type MasterTableName = "documents" | "videos" | "categories" | "applications" | "positions";

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

const DOCUMENTS_MASTER_TABLE = {
  tableName: "documents",
  label: "資料",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "資料名" },
    { key: "description", label: "説明" },
    { key: "url", label: "URL" },
    { key: "category_id", label: "カテゴリー" },
    { key: "assignee", label: "担当者名" },
    { key: "assignee_id", label: "担当者" },
    { key: "display_order", label: "表示順" },
    { key: "is_deleted", label: "削除状態" },
    { key: "created_by", label: "作成者" },
    { key: "updated_by", label: "更新者" },
    { key: "created_at", label: "作成日時" },
    { key: "updated_at", label: "更新日時" },
  ],
  listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  references: [
    { columnKey: "category_id", type: "category" },
    { columnKey: "assignee_id", type: "user" },
    { columnKey: "created_by", type: "user" },
    { columnKey: "updated_by", type: "user" },
  ],
} satisfies MasterTableDefinition<"documents">;

const VIDEOS_MASTER_TABLE = {
  tableName: "videos",
  label: "動画",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "動画名" },
    { key: "description", label: "説明" },
    { key: "url", label: "URL" },
    { key: "category_id", label: "カテゴリー" },
    { key: "assignee", label: "担当者名" },
    { key: "assignee_id", label: "担当者" },
    { key: "length", label: "動画時間" },
    { key: "thumbnail_path", label: "サムネイルパス" },
    { key: "thumbnail_time", label: "サムネイル時刻" },
    { key: "display_order", label: "表示順" },
    { key: "is_deleted", label: "削除状態" },
    { key: "created_by", label: "作成者" },
    { key: "updated_by", label: "更新者" },
    { key: "created_at", label: "作成日時" },
    { key: "updated_at", label: "更新日時" },
  ],
  listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  references: [
    { columnKey: "category_id", type: "category" },
    { columnKey: "assignee_id", type: "user" },
    { columnKey: "created_by", type: "user" },
    { columnKey: "updated_by", type: "user" },
  ],
} satisfies MasterTableDefinition<"videos">;

const CATEGORIES_MASTER_TABLE = {
  tableName: "categories",
  label: "カテゴリー",
  columns: [
    { key: "id", label: "ID" },
    { key: "category_type", label: "カテゴリー種別" },
    { key: "name", label: "カテゴリー名" },
    { key: "description", label: "説明" },
    { key: "display_order", label: "表示順" },
    { key: "is_deleted", label: "削除状態" },
    { key: "created_at", label: "作成日時" },
    { key: "updated_at", label: "更新日時" },
  ],
  listColumnKeys: ["id", "category_type", "name", "is_deleted", "updated_at"],
  references: [],
} satisfies MasterTableDefinition<"categories">;

const APPLICATIONS_MASTER_TABLE = {
  tableName: "applications",
  label: "アプリ",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "アプリ名" },
    { key: "description", label: "説明" },
    { key: "url", label: "URL" },
    { key: "category_id", label: "カテゴリー" },
    { key: "developer_id", label: "開発者" },
    { key: "thumbnail_path", label: "サムネイルパス" },
    { key: "display_order", label: "表示順" },
    { key: "is_deleted", label: "削除状態" },
    { key: "created_by", label: "作成者" },
    { key: "updated_by", label: "更新者" },
    { key: "created_at", label: "作成日時" },
    { key: "updated_at", label: "更新日時" },
  ],
  listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  references: [
    { columnKey: "category_id", type: "category" },
    { columnKey: "developer_id", type: "user" },
    { columnKey: "created_by", type: "user" },
    { columnKey: "updated_by", type: "user" },
  ],
} satisfies MasterTableDefinition<"applications">;

const POSITIONS_MASTER_TABLE = {
  tableName: "positions",
  label: "役職",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "役職名" },
    { key: "description", label: "説明" },
    { key: "display_order", label: "表示順" },
    { key: "is_deleted", label: "削除状態" },
    { key: "created_at", label: "作成日時" },
    { key: "updated_at", label: "更新日時" },
  ],
  listColumnKeys: ["id", "name", "is_deleted", "updated_at"],
  references: [],
} satisfies MasterTableDefinition<"positions">;

export const MASTER_TABLE_DEFINITIONS = [
  DOCUMENTS_MASTER_TABLE,
  VIDEOS_MASTER_TABLE,
  CATEGORIES_MASTER_TABLE,
  APPLICATIONS_MASTER_TABLE,
  POSITIONS_MASTER_TABLE,
] satisfies AnyMasterTableDefinition[];
