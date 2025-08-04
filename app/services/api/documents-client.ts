import { createClientSupabaseClient } from "./supabase-client";
import type { PostgrestError } from "@supabase/supabase-js";

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

interface CreateDocumentParams {
  name: string;
  categoryId: number;
  description: string;
  url: string;
  assignee: string;
  userId: number; // 作成者のユーザーID
}

export async function createDocumentOnServer(
  params: CreateDocumentParams
): Promise<{ data: CreateDocumentParams; error: PostgrestError | null }> {
  const supabase = await createClientSupabaseClient();

  const { data, error } = await supabase
    .from("documents")
    .insert([
      {
        name: params.name,
        category_id: params.categoryId,
        description: params.description,
        url: params.url,
        assignee: params.assignee,
        is_deleted: false,
        created_by: params.userId, // 作成者のユーザーID
        updated_by: params.userId, // 今回は作成者と更新者を同じにする
      },
    ])
    .select()
    .single();

  return { data, error };
}
