import { createClientSupabaseClient } from "./supabase-client";
import type { PostgrestError } from "@supabase/supabase-js";
import type { DocumentWithCategoryType, DocumentInsertFormType } from "@/app/types";

/**
 * 指定したidの資料を論理削除する
 * @param id 資料のid
 * @returns 削除結果
 */
export async function deleteDocument(id: number) {
  const supabase = createClientSupabaseClient();
  const { error } = await supabase.from("documents").update({ is_deleted: true }).eq("id", id);

  if (error) {
    console.error("Supabase 資料削除エラー:", error.message);
    return { success: false, error };
  }

  return { success: true, error: null };
}
/**
 * サーバーサイドで資料を登録する
 * @param params 資料のデータ
 * @returns 登録された資料とエラー
 */
export async function registerDocument(
  params: DocumentInsertFormType
): Promise<{ error: PostgrestError | null }> {
  const supabase = await createClientSupabaseClient();

  const { error } = await supabase.from("documents").insert([
    {
      name: params.name,
      category_id: params.categoryId,
      description: params.description,
      url: params.url,
      assignee: params.assignee,
      is_deleted: false,
      created_by: params.userId,
      updated_by: params.userId,
    },
  ]);

  return { error };
}
