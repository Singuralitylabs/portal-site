export type GeneratedMasterMetadataTableName =
  | "documents"
  | "videos"
  | "categories"
  | "applications"
  | "positions";

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
  {
    tableName: "documents",
    label: "資料",
    detailColumnKeys: [
      "id",
      "name",
      "description",
      "category_id",
      "url",
      "display_order",
      "created_by",
      "updated_by",
      "assignee",
      "assignee_id",
      "is_deleted",
      "created_at",
      "updated_at",
    ],
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
    references: [
      { columnKey: "assignee_id", type: "user" },
      { columnKey: "category_id", type: "category" },
      { columnKey: "created_by", type: "user" },
      { columnKey: "updated_by", type: "user" },
    ],
  },
  {
    tableName: "videos",
    label: "動画",
    detailColumnKeys: [
      "id",
      "name",
      "description",
      "category_id",
      "url",
      "thumbnail_path",
      "thumbnail_time",
      "length",
      "display_order",
      "created_by",
      "updated_by",
      "assignee",
      "assignee_id",
      "is_deleted",
      "created_at",
      "updated_at",
    ],
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
    references: [
      { columnKey: "assignee_id", type: "user" },
      { columnKey: "category_id", type: "category" },
      { columnKey: "created_by", type: "user" },
      { columnKey: "updated_by", type: "user" },
    ],
  },
  {
    tableName: "categories",
    label: "カテゴリー",
    detailColumnKeys: [
      "id",
      "category_type",
      "name",
      "description",
      "display_order",
      "is_deleted",
      "created_at",
      "updated_at",
    ],
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
    references: [],
  },
  {
    tableName: "applications",
    label: "アプリ",
    detailColumnKeys: [
      "id",
      "name",
      "description",
      "category_id",
      "url",
      "thumbnail_path",
      "developer_id",
      "display_order",
      "created_by",
      "updated_by",
      "is_deleted",
      "created_at",
      "updated_at",
    ],
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
    references: [
      { columnKey: "category_id", type: "category" },
      { columnKey: "created_by", type: "user" },
      { columnKey: "developer_id", type: "user" },
      { columnKey: "updated_by", type: "user" },
    ],
  },
  {
    tableName: "positions",
    label: "役職",
    detailColumnKeys: [
      "id",
      "name",
      "description",
      "display_order",
      "is_leadership",
      "is_deleted",
      "created_at",
      "updated_at",
    ],
    labels: {
      id: "ID",
      name: "役職名",
      description: "説明",
      display_order: "表示順",
      is_leadership: "会員一覧の役職者セクションに表示する役職かどうか",
      is_deleted: "削除状態",
      created_at: "作成日時",
      updated_at: "更新日時",
    },
    references: [],
  },
];
