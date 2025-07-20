import { createClientSupabaseClient } from "./supabase-client";

export async function fetchCategoriesByType(type: string) {
  const supabase = await createClientSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("category_type", type)
    .eq("is_deleted", false);

  if (error) {
    console.error("Supabase カテゴリーデータ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
