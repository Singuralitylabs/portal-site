import { createClientSupabaseClient } from "./supabase-client";
import type { ApplicationInsertFormType, ApplicationUpdateFormType } from "@/app/types";

/**
 * 指定したidのアプリを論理削除する
 * @param id アプリのid
 * @param userId ユーザーID
 * @returns 削除結果
 * - success: 成功した場合はtrue
 * - error: エラーが発生した場合はPostgrestErrorオブジェクト
 */
export async function deleteApplication(id: number, userId: number) {
  const supabase = createClientSupabaseClient();
  const { error } = await supabase
    .from("applications")
    .update({ is_deleted: true, updated_by: userId })
    .eq("id", id);

  if (error) {
    console.error("Supabase アプリ削除エラー:", error.message);
    return { success: false, error };
  }

  return { success: true, error: null };
}
/**
 * サーバーサイドでアプリを登録する
 * @param  ApplicationInsertFormType アプリのデータ
 * @return 登録結果
 * - success: 成功した場合はtrue
 * - error: エラーが発生した場合はPostgrestErrorオブジェクト
 */
export async function registerApplication({
  name,
  category_id,
  description,
  url,
  developer_id,
  created_by,
}: ApplicationInsertFormType) {
  const supabase = createClientSupabaseClient();
  const { error } = await supabase.from("applications").insert([
    {
      name,
      category_id,
      description,
      url,
      developer_id,
      is_deleted: false,
      created_by,
      updated_by: created_by,
    },
  ]);
  // エラーが発生した場合はコンソールにエラーメッセージを出力
  if (error) {
    console.error("Supabase アプリ登録エラー:", error.message);
    return { success: false, error };
  }

  return { success: true, error: null };
}

/**
 * サーバーサイドでアプリを更新する
 * @param id アプリのID
 * @param ApplicationUpdateFormType アプリの更新データ
 * @return 更新結果
 * - success: 成功した場合はtrue
 * - error: エラーが発生した場合はPostgrestErrorオブジェクト
 */
export async function updateApplication({
  id,
  name,
  category_id,
  description,
  url,
  developer_id,
  updated_by,
}: ApplicationUpdateFormType) {
  const supabase = createClientSupabaseClient();
  const { error } = await supabase
    .from("applications")
    .update({
      name,
      category_id,
      description,
      url,
      developer_id,
      updated_by,
    })
    .eq("id", id);

  // エラーが発生した場合はコンソールにエラーメッセージを出力
  if (error) {
    console.error("Supabase アプリ更新エラー:", error.message);
    return { success: false, error };
  }

  return { success: true, error: null };
}
