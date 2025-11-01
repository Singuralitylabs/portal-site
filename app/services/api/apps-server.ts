import { PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase-server";
import { AppWithCategoryAndDeveloperType } from "@/app/types";

/**
 * アプリ一覧を取得する
 * @returns アプリデータの配列とエラー情報
 */
export async function fetchApps(): Promise<{
  data: AppWithCategoryAndDeveloperType[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("apps")
    .select(`*, category:categories (name), developer:users!apps_developer_id_fkey (display_name)`)
    .eq("is_deleted", false)
    .order("display_order");

  if (error) {
    console.error("Supabase アプリ一覧データ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
