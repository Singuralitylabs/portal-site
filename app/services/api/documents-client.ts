import { createClientSupabaseClient } from "./supabase-client";

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
