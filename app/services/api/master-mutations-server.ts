import { createServerSupabaseClient } from "./supabase-server";
import {
  validateMasterMutation,
  type CategoryImpact,
  type MasterMutationInput,
  type MasterMutationResult,
} from "@/app/utils/master-validation";
import type { MasterTableName } from "@/app/constants/master";

export async function requireMasterManager() {
  const supabase = await createServerSupabaseClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("ログインが必要です。");
  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, status, is_deleted")
    .eq("auth_id", auth.user.id)
    .single();
  if (
    error ||
    !user ||
    user.is_deleted ||
    user.status !== "active" ||
    !["admin", "maintainer"].includes(user.role)
  ) {
    throw new Error("操作権限がありません。");
  }
  return supabase;
}

export async function mutateMasterRecord(
  input: MasterMutationInput
): Promise<MasterMutationResult> {
  try {
    const invalid = validateMasterMutation(input);
    if (invalid) return { success: false, error: { message: invalid } };
    const supabase = await requireMasterManager();
    let token = input.confirmationToken;
    if (input.table === "categories" && ["update", "delete"].includes(input.operation)) {
      const { data, error } = await supabase.rpc("master_category_preview", {
        category_id: input.id,
      });
      if (error) throw new Error(error.message);
      const preview = data as CategoryImpact;
      if (preview.token !== token && preview.contents.length > 0) {
        return {
          success: false,
          error: { message: "紐づくコンテンツを確認してください。" },
          confirmation: preview,
        };
      }
      if (token && preview.token !== token) {
        return {
          success: false,
          error: { message: "参照状況が変更されています。再確認してください。" },
          confirmation: preview,
        };
      }
      token = preview.token;
    }
    const { data, error } = await supabase.rpc("mutate_master_record", {
      table_name: input.table,
      operation: input.operation,
      record_id: input.id ?? null,
      fields: input.fields ?? {},
      placement: input.position ?? { type: "last" },
      confirmation_token: token ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true, error: null, id: data as number };
  } catch (error) {
    return {
      success: false,
      error: { message: error instanceof Error ? error.message : "更新に失敗しました。" },
    };
  }
}

export interface MasterFormOptions {
  categories: { id: number; name: string; category_type: string }[];
  members: { id: number; display_name: string }[];
  records: {
    id: number;
    name: string;
    display_order: number;
    category_id?: number;
    category_type?: string;
  }[];
  positionReferenced: boolean;
}

export async function fetchMasterFormOptions(
  table: MasterTableName,
  id?: number
): Promise<MasterFormOptions> {
  if (!["documents", "videos", "applications", "categories", "positions"].includes(table)) {
    throw new Error("対象が不正です。");
  }
  const supabase = await requireMasterManager();
  async function allRows<T>(
    fetchPage: (
      offset: number
    ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
  ): Promise<T[]> {
    const rows: T[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await fetchPage(offset);
      if (error) throw new Error(error.message);
      rows.push(...(data ?? []));
      if (!data || data.length < 500) return rows;
    }
  }
  const [categories, members, records, reference] = await Promise.all([
    allRows<MasterFormOptions["categories"][number]>(offset =>
      supabase
        .from("categories")
        .select("id,name,category_type")
        .eq("is_deleted", false)
        .order("id")
        .range(offset, offset + 499)
    ),
    allRows<MasterFormOptions["members"][number]>(offset =>
      supabase
        .from("member_profiles")
        .select("id,display_name")
        .order("id")
        .range(offset, offset + 499)
    ),
    allRows<MasterFormOptions["records"][number]>(offset =>
      supabase
        .from(table)
        .select("*")
        .eq("is_deleted", false)
        .order("id")
        .range(offset, offset + 499)
    ),
    table === "positions" && id
      ? supabase
          .from("position_tags")
          .select("id", { count: "exact", head: true })
          .eq("position_id", id)
      : Promise.resolve({ count: 0, error: null }),
  ]);
  if (reference.error) throw new Error(reference.error.message);
  return { categories, members, records, positionReferenced: (reference.count ?? 0) > 0 };
}
