import { PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase-server";

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
