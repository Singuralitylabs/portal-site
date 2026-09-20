import {
  GENERATED_MASTER_METADATA,
  type GeneratedMasterMetadataReference,
  type GeneratedMasterMetadataReferenceType,
  type GeneratedMasterMetadataTable,
  type GeneratedMasterMetadataTableName,
} from "./master-metadata.generated";
import { MASTER_METADATA_OVERRIDE } from "./master-metadata.override";

export type MasterMetadataTableName = GeneratedMasterMetadataTableName;
export type MasterMetadataReferenceType = GeneratedMasterMetadataReferenceType;
export type MasterMetadataReference = GeneratedMasterMetadataReference;

export type MasterMetadataTable = {
  tableName: MasterMetadataTableName;
  label: string;
  detailColumnKeys: readonly string[];
  listColumnKeys: readonly string[];
  labels: Record<string, string>;
  references: readonly MasterMetadataReference[];
  appendUnknownColumns?: boolean;
};

// 自動生成 metadata と手書き override をテーブル名で突き合わせるための索引。
const overrideByTableName = new Map(
  MASTER_METADATA_OVERRIDE.map(override => [override.tableName, override])
);

// docs 由来の自動生成層に UI 固有の override を重ね、master.ts 生成の入力へ揃える。
export const MASTER_METADATA: readonly MasterMetadataTable[] = GENERATED_MASTER_METADATA.map(
  table => mergeTableMetadata(table)
);

// 自動生成側をベースに、一覧カラムや docs 未反映差分だけ override で上書きする。
function mergeTableMetadata(table: GeneratedMasterMetadataTable): MasterMetadataTable {
  const override = overrideByTableName.get(table.tableName);
  if (!override) {
    throw new Error(`MASTER_METADATA_OVERRIDE に ${table.tableName} が見つかりません。`);
  }

  return {
    tableName: table.tableName,
    label: override.label ?? table.label,
    detailColumnKeys: override.detailColumnKeys ?? table.detailColumnKeys,
    listColumnKeys: override.listColumnKeys,
    labels: {
      ...table.labels,
      ...override.labels,
    },
    references: override.references ?? table.references,
    appendUnknownColumns: override.appendUnknownColumns,
  };
}
