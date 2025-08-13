import { createClientSupabaseClient } from "./supabase-client";
import type { VideoInsertFormType, VideoUpdateFormType } from "@/app/types";

/**
 * 動画を新規登録する
 * @param params VideoInsertFormType型の動画データ
 * @returns 登録結果
 */
export async function registerVideo(params: VideoInsertFormType) {
  const supabase = await createClientSupabaseClient();
  const { error } = await supabase.from("videos").insert([
    {
      ...params,
      is_deleted: false,
      updated_by: params.created_by,
    },
  ]);
  if (error) {
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
  const supabase = await createClientSupabaseClient();
  // idだけ分離し、残りをupdate対象に
  const { id, ...updateFields } = params;
  const { error } = await supabase.from("videos").update(updateFields).eq("id", id);
  if (error) {
    return { success: false, error };
  }
  return { success: true, error: null };
}

/**
 * 動画を論理削除する
 * @param id 動画ID
 * @returns 削除結果
 */
export async function deleteVideo(id: number) {
  const supabase = await createClientSupabaseClient();
  const { error } = await supabase.from("videos").update({ is_deleted: true }).eq("id", id);
  if (error) {
    return { success: false, error };
  }
  return { success: true, error: null };
}

/**
 * 動画一覧を取得する
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @returns 動画一覧
 */
export async function getVideos(params: {
  page: number;
  limit: number;
  search?: string;
  category_id?: number;
}) {
  const supabase = await createClientSupabaseClient();
  let query = supabase
    .from("videos")
    .select("*, categories (name)")
    .eq("is_deleted", false)
    .order("id", { ascending: false })
    .range((params.page - 1) * params.limit, params.page * params.limit - 1);

  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  if (params.category_id) {
    query = query.eq("category_id", params.category_id);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, error };
  }
  return { success: true, data, error: null };
}

/**
 * 動画詳細を取得する
 * @param id 動画ID
 * @returns 動画詳細
 */
export async function getVideoDetail(id: number) {
  const supabase = await createClientSupabaseClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*, categories (name)")
    .eq("id", id)
    .single();
  if (error) {
    return { success: false, error };
  }
  return { success: true, data, error: null };
}

/**
 * カテゴリ一覧を取得する
 * @returns カテゴリ一覧
 */
export async function getCategories() {
  const supabase = await createClientSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("id", { ascending: true });
  if (error) {
    return { success: false, error };
  }
  return { success: true, data, error: null };
}
