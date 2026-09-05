import { PostgrestError } from "@supabase/supabase-js";
import {
  AnyMasterTableDefinition,
  MASTER_TABLE_DEFINITIONS,
  MasterFieldValue,
  MasterTableName,
} from "@/app/constants/master";
import { createServerSupabaseClient } from "./supabase-server";

type RawMasterRecord = Record<string, MasterFieldValue> & { id: number };

export type MasterRecordField = {
  key: string;
  label: string;
  value: MasterFieldValue;
  referenceLabel: string | null;
};

export type MasterRecord = {
  id: number;
  fields: MasterRecordField[];
};

export type MasterTableData = {
  tableName: MasterTableName;
  label: string;
  listColumnKeys: string[];
  records: MasterRecord[];
};

export type MasterManagementData = {
  tables: MasterTableData[];
};

type ReferenceMaps = {
  categories: Map<number, string>;
  users: Map<number, string>;
};

type MasterRowsByTable = {
  [T in MasterTableName]: RawMasterRecord[];
};

async function fetchMasterRows(): Promise<{
  data: MasterRowsByTable | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const [documents, videos, categories, applications, positions] = await Promise.all([
    supabase.from("documents").select("*").order("id", { ascending: true }),
    supabase.from("videos").select("*").order("id", { ascending: true }),
    supabase.from("categories").select("*").order("id", { ascending: true }),
    supabase.from("applications").select("*").order("id", { ascending: true }),
    supabase.from("positions").select("*").order("id", { ascending: true }),
  ]);

  const error =
    documents.error ?? videos.error ?? categories.error ?? applications.error ?? positions.error;
  if (error) {
    console.error("マスター管理データ取得エラー:", error.message);
    return { data: null, error };
  }

  return {
    data: {
      documents: documents.data as RawMasterRecord[],
      videos: videos.data as RawMasterRecord[],
      categories: categories.data as RawMasterRecord[],
      applications: applications.data as RawMasterRecord[],
      positions: positions.data as RawMasterRecord[],
    },
    error: null,
  };
}

function collectReferenceIds(rowsByTable: MasterRowsByTable, referenceType: "category" | "user") {
  const ids = new Set<number>();

  MASTER_TABLE_DEFINITIONS.forEach(table => {
    const references = table.references.filter(reference => reference.type === referenceType);
    rowsByTable[table.tableName].forEach(row => {
      references.forEach(reference => {
        const value = row[reference.columnKey];
        if (typeof value === "number") {
          ids.add(value);
        }
      });
    });
  });

  return [...ids];
}

async function fetchReferenceMaps(rowsByTable: MasterRowsByTable): Promise<{
  data: ReferenceMaps | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const categoryIds = collectReferenceIds(rowsByTable, "category");
  const userIds = collectReferenceIds(rowsByTable, "user");

  const [categories, users] = await Promise.all([
    categoryIds.length > 0
      ? supabase.from("categories").select("id, name").in("id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length > 0
      ? supabase.from("users").select("id, display_name").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const error = categories.error ?? users.error;
  if (error) {
    console.error("マスター管理参照データ取得エラー:", error.message);
    return { data: null, error };
  }

  return {
    data: {
      categories: new Map((categories.data ?? []).map(category => [category.id, category.name])),
      users: new Map((users.data ?? []).map(user => [user.id, user.display_name])),
    },
    error: null,
  };
}

function findReference(references: AnyMasterTableDefinition["references"], columnKey: string) {
  return references.find(reference => reference.columnKey === columnKey) ?? null;
}

function resolveReferenceLabel(
  value: MasterFieldValue,
  reference: AnyMasterTableDefinition["references"][number] | null,
  referenceMaps: ReferenceMaps
) {
  if (!reference || typeof value !== "number") {
    return null;
  }

  if (reference.type === "category") {
    return referenceMaps.categories.get(value) ?? "不明なカテゴリー";
  }

  return referenceMaps.users.get(value) ?? "退会済みユーザー";
}

function createMasterTableData(
  definition: AnyMasterTableDefinition,
  rows: RawMasterRecord[],
  referenceMaps: ReferenceMaps
): MasterTableData {
  return {
    tableName: definition.tableName,
    label: definition.label,
    listColumnKeys: definition.listColumnKeys,
    records: rows.map(row => ({
      id: row.id,
      fields: definition.columns.map(column => {
        const value = row[column.key] ?? null;
        const reference = findReference(definition.references, column.key);

        return {
          key: column.key,
          label: column.label,
          value,
          referenceLabel: resolveReferenceLabel(value, reference, referenceMaps),
        };
      }),
    })),
  };
}

export async function fetchMasterManagementData(): Promise<{
  data: MasterManagementData | null;
  error: PostgrestError | null;
}> {
  const rows = await fetchMasterRows();
  if (rows.error || !rows.data) {
    return { data: null, error: rows.error };
  }

  const rowsByTable = rows.data;

  const referenceMaps = await fetchReferenceMaps(rowsByTable);
  if (referenceMaps.error || !referenceMaps.data) {
    return { data: null, error: referenceMaps.error };
  }

  const referenceMapData = referenceMaps.data;

  return {
    data: {
      tables: MASTER_TABLE_DEFINITIONS.map(definition =>
        createMasterTableData(definition, rowsByTable[definition.tableName], referenceMapData)
      ),
    },
    error: null,
  };
}
