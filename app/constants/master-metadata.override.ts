// master 参照画面向け metadata の手書き override をまとめる定義ファイル。
// docs 由来の generated metadata では表現しにくい一覧表示列や個別調整だけをここで補完する。

import type {
  GeneratedMasterMetadataReference,
  GeneratedMasterMetadataTableName,
} from "./master-metadata.generated";

export type MasterMetadataOverrideTable = {
  tableName: GeneratedMasterMetadataTableName;
  label?: string;
  detailColumnKeys?: readonly string[];
  listColumnKeys: readonly string[];
  labels?: Record<string, string>;
  references?: readonly GeneratedMasterMetadataReference[];
  appendUnknownColumns?: boolean;
};

// docs では表現しきれない一覧表示列や schema 先行差分だけを手書きで持つ。
export const MASTER_METADATA_OVERRIDE: readonly MasterMetadataOverrideTable[] = [
  {
    tableName: "documents",
    listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  },
  {
    tableName: "videos",
    listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  },
  {
    tableName: "categories",
    listColumnKeys: ["id", "category_type", "name", "is_deleted", "updated_at"],
    appendUnknownColumns: false,
  },
  {
    tableName: "applications",
    listColumnKeys: ["id", "name", "category_id", "is_deleted", "updated_at"],
  },
  {
    tableName: "positions",
    listColumnKeys: ["id", "name", "is_leadership", "is_deleted", "updated_at"],
    labels: {
      is_leadership: "役職者フラグ",
    },
  },
];
