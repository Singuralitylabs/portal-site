import { createClientSupabaseClient } from "./supabase-client";
import type { VideoInsertFormType, VideoUpdateFormType } from "@/app/types";

/**
 * 動画を新規登録する
 * @param params VideoInsertFormType型の動画データ
 * @returns 登録結果
 */
export async function registerVideo(params: VideoInsertFormType) {
  const supabase = createClientSupabaseClient();
  const { error } = await supabase.from("videos").insert([
    {
      ...params,
      is_deleted: false,
      updated_by: params.created_by,
    },
  ]);
  if (error) {
    console.error("動画の登録に失敗:", error);
    return { success: false, error };
  }
  return { success: true, error: null };
}

/**
 * 動画を更新する
 * @param params VideoUpdateFormType型の更新データ
 * @returns 更新結果
 */
export async function updateVideo(params: VideoUpdateFormType) {
  const supabase = createClientSupabaseClient();
  // idだけ分離し、残りをupdate対象に
  const { id, ...updateFields } = params;
  const { error } = await supabase.from("videos").update(updateFields).eq("id", id);
  if (error) {
    console.error("動画の更新に失敗:", error);
    return { success: false, error };
  }
  return { success: true, error: null };
}

/**
 * 動画を論理削除する
 * @param id 動画ID
 * @param userId 更新者のユーザーID
 * @returns 削除結果
 */
export async function deleteVideo(id: number, userId: number) {
  const supabase = createClientSupabaseClient();
  const { error } = await supabase
    .from("videos")
    .update({ is_deleted: true, updated_by: userId })
    .eq("id", id);
  if (error) {
    console.error("動画の削除に失敗:", error);
    return { success: false, error };
  }
  return { success: true, error: null };
}
