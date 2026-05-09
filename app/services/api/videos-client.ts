import { createClientSupabaseClient } from "./supabase-client";
import type { CategoryItemType, VideoInsertFormType, VideoUpdateFormType } from "@/app/types";
import {
  getItemsByCategory,
  calculateDisplayOrder,
  shiftDisplayOrder,
  reorderItemsInCategory,
} from "./utils/display-order";

/**
 * 指定されたカテゴリー内の動画一覧を取得する
 * @param categoryId カテゴリーID
 * @param excludeId 除外する動画ID（編集時に自分自身を除外するため）
 * @returns 動画一覧（id, name, display_order）
 */
export async function getVideosByCategory(
  categoryId: number,
  excludeId?: number
): Promise<CategoryItemType[]> {
  return getItemsByCategory("videos", categoryId, excludeId);
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

/**
 * 動画を新規登録する
 * @param params VideoInsertFormType型の動画データ
 * @returns 登録結果
 */
export async function registerVideo({
  name,
  category_id,
  description,
  url,
  thumbnail_path,
  thumbnail_time,
  length,
  assignee_id,
  created_by,
  position,
}: VideoInsertFormType) {
  // 配置位置から display_order を計算
  const display_order = await calculateDisplayOrder("videos", category_id, position);

  // 新規動画を挿入する前に、指定位置以降の動画の display_order を +1 する
  if (position.type === "first" || position.type === "after") {
    await shiftDisplayOrder("videos", category_id, display_order);
  }

  const supabase = createClientSupabaseClient();
  const { error } = await supabase.from("videos").insert([
    {
      name,
      category_id,
      description,
      url,
      thumbnail_path,
      thumbnail_time,
      length,
      assignee_id,
      display_order,
      is_deleted: false,
      created_by,
      updated_by: created_by,
    },
  ]);

  if (error) {
    console.error("動画の登録に失敗:", error);
    return { success: false, error };
  }

  // 登録後、カテゴリー内の display_order を振り直す
  await reorderItemsInCategory("videos", category_id);

  return { success: true, error: null };
}

/**
 * 動画を更新する
 * @param params VideoUpdateFormType型の更新データ
 * @returns 更新結果
 */
export async function updateVideo({
  id,
  name,
  category_id,
  description,
  url,
  thumbnail_path,
  thumbnail_time,
  length,
  assignee_id,
  updated_by,
  position,
}: VideoUpdateFormType) {
  const supabase = createClientSupabaseClient();

  // 現在の動画情報を取得（現在のdisplay_orderとcategory_idを知るため）
  const { data: currentVideo } = await supabase
    .from("videos")
    .select("display_order, category_id")
    .eq("id", id)
    .single();

  const currentDisplayOrder = currentVideo?.display_order;
  const currentCategoryId = currentVideo?.category_id;

  // 新しい display_order を計算（編集時は自分自身を除外して計算）
  const display_order = await calculateDisplayOrder(
    "videos",
    category_id,
    position,
    currentDisplayOrder
  );

  // 動画を更新する前に、指定位置以降の動画の display_order を +1 する
  if (position.type === "first" || position.type === "after") {
    await shiftDisplayOrder("videos", category_id, display_order, id);
  }

  const { error } = await supabase
    .from("videos")
    .update({
      name,
      category_id,
      description,
      url,
      thumbnail_path,
      thumbnail_time,
      length,
      assignee_id,
      display_order,
      updated_by,
    })
    .eq("id", id);

  if (error) {
    console.error("動画の更新に失敗:", error);
    return { success: false, error };
  }

  // 更新後、カテゴリー内の display_order を振り直す
  await reorderItemsInCategory("videos", category_id);

  // カテゴリーが変更された場合、元のカテゴリーも振り直す
  if (currentCategoryId && currentCategoryId !== category_id) {
    await reorderItemsInCategory("videos", currentCategoryId);
  }

  return { success: true, error: null };
}
