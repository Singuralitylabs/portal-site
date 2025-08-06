import { createClientSupabaseClient } from "./supabase-client";
import type { PostgrestError } from "@supabase/supabase-js";
import type { DocumentInsertFormType } from "@/app/types";

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
 * @param  DocumentInsertFormType 資料のデータ
 * @returns 登録された資料
 */
export async function registerDocument({
  name,
  category_id,
  description,
  url,
  assignee,
  created_by,
}: DocumentInsertFormType): Promise<{ error: PostgrestError | null }> {
  const supabase = await createClientSupabaseClient();
  if (!name || !url || category_id === 0) {
    throw new Error("必須項目が未入力です");
  }
  const { error } = await supabase.from("documents").insert([
    {
      name,
      category_id: category_id,
      description,
      url,
      assignee,
      is_deleted: false,
      created_by: created_by,
      updated_by: created_by,
    },
  ]);

  return { error };
}
