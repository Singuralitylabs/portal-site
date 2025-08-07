import { createClientSupabaseClient } from "./supabase-client";
import type { PostgrestError } from "@supabase/supabase-js";
import type { DocumentInsertFormType } from "@/app/types";

/**
 * 指定したidの資料を論理削除する
 * @param id 資料のid
 * @returns 削除結果
 * - success: 成功した場合はtrue
 * - error: エラーが発生した場合はPostgrestErrorオブジェクト
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
 * @return 登録結果
 * - success: 成功した場合はtrue
 * - error: エラーが発生した場合はPostgrestErrorオブジェクト
 */
export async function registerDocument({
  name,
  category_id,
  description,
  url,
  assignee,
  created_by,
}: DocumentInsertFormType) {
  const supabase = await createClientSupabaseClient();
  const { error } = await supabase.from("documents").insert([
    {
      name,
      category_id,
      description,
      url,
      assignee,
      is_deleted: false,
      created_by,
      updated_by: created_by,
    },
  ]);
  // エラーが発生した場合はコンソールにエラーメッセージを出力
  if (error) {
    console.error("Supabase 資料登録エラー:", error.message);
    return { success: false, error };
  }

  return { success: true, error: null };
}
