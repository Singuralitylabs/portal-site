import { PostgrestError } from "@supabase/supabase-js";
import {
  AnyMasterTableDefinition,
  MASTER_TABLE_DEFINITIONS,
  MasterFieldValue,
  MasterTableName,
} from "@/app/constants/master";
import { createServerSupabaseClient } from "./supabase-server";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type UserReferenceRow = { id: number; display_name: string };
const MASTER_RECORD_FETCH_LIMIT = 1000;

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
  fieldMap: Record<string, MasterRecordField>;
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

// master 管理画面の対象 5 テーブルをまとめて取得し、後続処理で扱いやすい形へ揃える。
async function fetchMasterRows(supabase: SupabaseServerClient): Promise<{
  data: MasterRowsByTable | null;
  error: PostgrestError | null;
}> {
  const [documents, videos, categories, applications, positions] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .order("id", { ascending: true })
      .limit(MASTER_RECORD_FETCH_LIMIT),
    supabase
      .from("videos")
      .select("*")
      .order("id", { ascending: true })
      .limit(MASTER_RECORD_FETCH_LIMIT),
    supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: true })
      .limit(MASTER_RECORD_FETCH_LIMIT),
    supabase
      .from("applications")
      .select("*")
      .order("id", { ascending: true })
      .limit(MASTER_RECORD_FETCH_LIMIT),
    supabase
      .from("positions")
      .select("*")
      .order("id", { ascending: true })
      .limit(MASTER_RECORD_FETCH_LIMIT),
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

// 参照解決に必要な category / user の ID を、全テーブル分まとめて抽出する。
function collectReferenceIds(rowsByTable: MasterRowsByTable, referenceType: "category" | "user") {
  const ids = new Set<number>();

  // 表示対象テーブル全体から参照先 ID を先に集約し、参照解決クエリ回数を増やさないようにする。
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

// 抽出した参照先 ID から、画面表示に使う名称マップを一括取得する。
async function fetchReferenceMaps(
  supabase: SupabaseServerClient,
  rowsByTable: MasterRowsByTable
): Promise<{
  data: ReferenceMaps | null;
  error: PostgrestError | null;
}> {
  const userIds = collectReferenceIds(rowsByTable, "user");

  const users: { data: UserReferenceRow[] | null; error: PostgrestError | null } =
    userIds.length > 0
      ? await supabase.from("users").select("id, display_name").in("id", userIds)
      : { data: [], error: null };

  const error = users.error;
  if (error) {
    console.error("マスター管理参照データ取得エラー:", error.message);
    return { data: null, error };
  }

  return {
    data: {
      categories: new Map(
        rowsByTable.categories.map(category => [category.id, String(category.name)])
      ),
      users: new Map((users.data ?? []).map(user => [user.id, user.display_name])),
    },
    error: null,
  };
}

// カラムキーに対応する参照定義を探し、参照解決が必要かどうかを判定する。
function findReference(references: AnyMasterTableDefinition["references"], columnKey: string) {
  return references.find(reference => reference.columnKey === columnKey) ?? null;
}

// 参照定義と参照先マップを使い、外部キー値を画面表示用の名称へ変換する。
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

  // users 参照が取得済みで該当 ID だけ見つからない場合は、退会済みユーザーとして扱う。
  return referenceMaps.users.get(value) ?? "退会済みユーザー";
}

// 1 テーブル分の生データを、一覧列と詳細表示列を持つ画面描画用データへ変換する。
function createMasterTableData(
  definition: AnyMasterTableDefinition,
  rows: RawMasterRecord[],
  referenceMaps: ReferenceMaps
): MasterTableData {
  return {
    tableName: definition.tableName,
    label: definition.label,
    listColumnKeys: definition.listColumnKeys,
    records: rows.map(row => {
      const fields = definition.columns.map(column => {
        const value = row[column.key] ?? null;
        const reference = findReference(definition.references, column.key);

        return {
          key: column.key,
          label: column.label,
          value,
          referenceLabel: resolveReferenceLabel(value, reference, referenceMaps),
        };
      });

      return {
        id: row.id,
        fields,
        fieldMap: Object.fromEntries(fields.map(field => [field.key, field])),
      };
    }),
  };
}

// 対象テーブル取得と参照解決をまとめて実行し、master 管理画面の初期表示データを返す。
export async function fetchMasterManagementData(): Promise<{
  data: MasterManagementData | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();

  const rows = await fetchMasterRows(supabase);
  if (rows.error || !rows.data) {
    return { data: null, error: rows.error };
  }

  const rowsByTable = rows.data;

  const referenceMaps = await fetchReferenceMaps(supabase, rowsByTable);
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
