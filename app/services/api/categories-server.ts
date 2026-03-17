import { PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase-server";
import type { CategoryManagementItemType, CategoryTypeValue } from "@/app/types";

export async function fetchCategoriesByType(type: string): Promise<{
  data: { id: number; name: string }[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("category_type", type)
    .eq("is_deleted", false)
    .order("display_order");

  if (error) {
    console.error("Supabase カテゴリーデータ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function fetchCategoriesForManagement(type: CategoryTypeValue): Promise<{
  data: CategoryManagementItemType[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, category_type, name, description, display_order")
    .eq("category_type", type)
    .eq("is_deleted", false)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Supabase カテゴリー管理データ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
