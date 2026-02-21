import { PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase-server";
import { DocumentWithCategoryType } from "@/app/types";

export async function fetchDocuments(): Promise<{
  data: DocumentWithCategoryType[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      `*, category:categories (name),
      assignee:users!documents_assignee_fk  (display_name)`
    )
    .eq("is_deleted", false)
    .order("display_order");

  if (error) {
    console.error("Supabase 資料一覧データ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
