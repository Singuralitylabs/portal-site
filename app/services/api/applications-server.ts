import { PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase-server";
import { ApplicationWithCategoryAndDeveloperType } from "@/app/types";

/**
 * アプリ一覧を取得する
 * @returns アプリデータの配列とエラー情報
 */
export async function fetchApplications(): Promise<{
  data: ApplicationWithCategoryAndDeveloperType[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      `*, category:categories (name), developer:users!applications_developer_id_fkey (display_name)`
    )
    .eq("is_deleted", false)
    .order("display_order");

  if (error) {
    console.error("Supabase アプリ一覧データ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
