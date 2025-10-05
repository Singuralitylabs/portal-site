import { createClientSupabaseClient } from "./supabase-client";
import type { DocumentInsertFormType, DocumentUpdateFormType } from "@/app/types";

/**
 * 指定したidの資料を論理削除する
 * @param id 資料のid
 * @param userId ユーザーID
 * @returns 削除結果
 * - success: 成功した場合はtrue
 * - error: エラーが発生した場合はPostgrestErrorオブジェクト
 */
export async function deleteDocument(id: number, userId: number) {
  const supabase = createClientSupabaseClient();
  const { error } = await supabase
    .from("documents")
    .update({ is_deleted: true, updated_by: userId })
    .eq("id", id);

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

/**
 * サーバーサイドで資料を更新する
 * @param id 資料のID
 * @param DocumentUpdateFormType 資料の更新データ
 * @return 更新結果
 * - success: 成功した場合はtrue
 * - error: エラーが発生した場合はPostgrestErrorオブジェクト
 */
export async function updateDocument({
  id,
  name,
  category_id,
  description,
  url,
  assignee,
  updated_by,
}: DocumentUpdateFormType) {
  const supabase = await createClientSupabaseClient();
  const { error } = await supabase
    .from("documents")
    .update({
      name,
      category_id,
      description,
      url,
      assignee,
      updated_by,
    })
    .eq("id", id);

  // エラーが発生した場合はコンソールにエラーメッセージを出力
  if (error) {
    console.error("Supabase 資料更新エラー:", error.message);
    return { success: false, error };
  }

  return { success: true, error: null };
}
