/**
 * ファイル概要: 動画（videos）管理 API（クライアント側）
 *
 * 処理内容:
 * - カテゴリー内動画一覧取得、登録、更新、論理削除を提供する
 * - 登録/更新時に `display_order` を計算し、必要に応じたシフトと再採番を実行する
 * - 共通ユーティリティ由来の例外を捕捉し、`{ success: false, error }` 契約で返却する
 *
 * 公開関数:
 * - `getVideosByCategory(categoryId, excludeId?)`
 * - `registerVideo(payload)`
 * - `updateVideo(payload)`
 * - `deleteVideo(id, userId)`
 *
 * 依存関係:
 * - `createClientSupabaseClient`（Supabase クライアント生成）
 * - `utils/display-order`（一覧取得・表示順計算・シフト・再採番）
 * - `@/app/types`（動画関連フォーム/型定義）
 */
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
 * @param param0 VideoInsertFormType型の動画データ
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
  let didShiftDisplayOrder = false;

  const recoverDisplayOrderAfterFailure = async () => {
    if (!didShiftDisplayOrder) {
      return;
    }

    try {
      await reorderItemsInCategory("videos", category_id);
    } catch (recoveryError) {
      console.error("動画登録失敗後の表示順復旧に失敗:", recoveryError);
    }
  };

  try {
    // 配置位置から display_order を計算
    const display_order = await calculateDisplayOrder("videos", category_id, position);

    // 新規動画を挿入する前に、指定位置以降の動画の display_order を +1 する
    if (position.type === "first" || position.type === "after") {
      await shiftDisplayOrder("videos", category_id, display_order);
      didShiftDisplayOrder = true;
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
      await recoverDisplayOrderAfterFailure();
      console.error("動画の登録に失敗:", error);
      return { success: false, error };
    }

    // 登録後、カテゴリー内の display_order を振り直す
    await reorderItemsInCategory("videos", category_id);

    return { success: true, error: null };
  } catch (error) {
    await recoverDisplayOrderAfterFailure();
    console.error("動画の登録に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("動画登録に失敗しました。"),
    };
  }
}

/**
 * 動画を更新する
 * @param param0 VideoUpdateFormType型の更新データ
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
  let currentCategoryId: number | null = null;

  const recoverDisplayOrderAfterFailure = async () => {
    const reorderTargets = [category_id, currentCategoryId].filter(
      (targetId, index, ids): targetId is number =>
        targetId !== null && targetId !== undefined && ids.indexOf(targetId) === index
    );

    for (const targetCategoryId of reorderTargets) {
      try {
        await reorderItemsInCategory("videos", targetCategoryId);
      } catch (recoveryError) {
        console.error("動画更新失敗後の表示順復旧に失敗:", recoveryError);
      }
    }
  };

  try {
    const supabase = createClientSupabaseClient();

    // 現在の動画情報を取得（現在のdisplay_orderとcategory_idを知るため）
    const { data: currentVideo, error: currentVideoError } = await supabase
      .from("videos")
      .select("display_order, category_id")
      .eq("id", id)
      .single();

    if (currentVideoError || !currentVideo) {
      const fetchError =
        currentVideoError ?? new Error("対象の動画が存在しないか、参照権限がありません。");
      console.error("動画の現在値取得に失敗:", fetchError);
      return { success: false, error: fetchError };
    }

    const currentDisplayOrder = currentVideo.display_order;
    currentCategoryId = currentVideo.category_id;

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

    const { data: updatedVideo, error } = await supabase
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
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      await recoverDisplayOrderAfterFailure();
      console.error("動画の更新に失敗:", error);
      return { success: false, error };
    }

    if (!updatedVideo) {
      const noRowUpdatedError = new Error("更新対象の動画が見つからないため、更新を中断しました。");
      await recoverDisplayOrderAfterFailure();
      console.error("動画の更新に失敗:", noRowUpdatedError.message);
      return { success: false, error: noRowUpdatedError };
    }

    // 更新後、カテゴリー内の display_order を振り直す
    await reorderItemsInCategory("videos", category_id);

    // カテゴリーが変更された場合、元のカテゴリーも振り直す
    if (currentCategoryId !== null && currentCategoryId !== category_id) {
      await reorderItemsInCategory("videos", currentCategoryId);
    }

    return { success: true, error: null };
  } catch (error) {
    await recoverDisplayOrderAfterFailure();
    console.error("動画の更新に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("動画更新に失敗しました。"),
    };
  }
}
