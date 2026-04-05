import { createClientSupabaseClient } from "./supabase-client";
import type { CategoryItemType, DocumentInsertFormType, DocumentUpdateFormType } from "@/app/types";
import {
  getItemsByCategory,
  calculateDisplayOrder,
  shiftDisplayOrder,
  reorderItemsInCategory,
} from "./utils/display-order";

/**
 * 指定されたカテゴリー内の資料一覧を取得する
 * @param categoryId カテゴリーID
 * @param excludeId 除外する資料ID（編集時に自分自身を除外するため）
 * @returns 資料一覧（id, name, display_order）
 */
export async function getDocumentsByCategory(
  categoryId: number,
  excludeId?: number
): Promise<CategoryItemType[]> {
  return getItemsByCategory("documents", categoryId, excludeId);
}

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
 * @param DocumentInsertFormType 資料のデータ
 * @return 登録結果
 * - success: 成功した場合はtrue
 * - error: エラーが発生した場合はPostgrestErrorオブジェクト
 */
export async function registerDocument({
  name,
  category_id,
  description,
  url,
  assignee_id,
  created_by,
  position,
}: DocumentInsertFormType) {
  // 配置位置から display_order を計算
  const display_order = await calculateDisplayOrder("documents", category_id, position);

  // 新規資料を挿入する前に、指定位置以降の資料の display_order を +1 する
  if (position.type === "first" || position.type === "after") {
    await shiftDisplayOrder("documents", category_id, display_order);
  }

  const supabase = createClientSupabaseClient();
  const { error } = await supabase.from("documents").insert([
    {
      name,
      category_id,
      description,
      url,
      assignee_id,
      display_order,
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

  // 登録後、カテゴリー内の display_order を振り直す
  await reorderItemsInCategory("documents", category_id);

  return { success: true, error: null };
}

/**
 * サーバーサイドで資料を更新する
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
  assignee_id,
  updated_by,
  position,
}: DocumentUpdateFormType) {
  const supabase = createClientSupabaseClient();

  // 現在の資料情報を取得（現在のdisplay_orderとcategory_idを知るため）
  const { data: currentDoc } = await supabase
    .from("documents")
    .select("display_order, category_id")
    .eq("id", id)
    .single();

  const currentDisplayOrder = currentDoc?.display_order;
  const currentCategoryId = currentDoc?.category_id;

  // 新しい display_order を計算（編集時は自分自身を除外して計算）
  const display_order = await calculateDisplayOrder(
    "documents",
    category_id,
    position,
    currentDisplayOrder
  );

  // 資料を更新する前に、指定位置以降の資料の display_order を +1 する
  if (position.type === "first" || position.type === "after") {
    await shiftDisplayOrder("documents", category_id, display_order, id);
  }

  const { error } = await supabase
    .from("documents")
    .update({
      name,
      category_id,
      description,
      url,
      assignee_id,
      display_order,
      updated_by,
    })
    .eq("id", id);

  // エラーが発生した場合はコンソールにエラーメッセージを出力
  if (error) {
    console.error("Supabase 資料更新エラー:", error.message);
    return { success: false, error };
  }

  // 更新後、カテゴリー内の display_order を振り直す
  await reorderItemsInCategory("documents", category_id);

  // カテゴリーが変更された場合、元のカテゴリーも振り直す
  if (currentCategoryId && currentCategoryId !== category_id) {
    await reorderItemsInCategory("documents", currentCategoryId);
  }

  return { success: true, error: null };
}
