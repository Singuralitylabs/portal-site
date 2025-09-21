import { createServerSupabaseClient } from "./supabase-server";

export async function fetchCategoriesByType(type: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("category_type", type)
    .eq("is_deleted", false)
    .order("display_order");

  if (error) {
    console.error("Supabase カテゴリーデータ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
