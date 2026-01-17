import { createClientSupabaseClient } from "./supabase-client";
import type {
  ApplicationInsertFormType,
  ApplicationUpdateFormType,
  CategoryItemType,
} from "@/app/types";
import {
  getItemsByCategory,
  calculateDisplayOrder,
  shiftDisplayOrder,
  reorderItemsInCategory,
} from "./utils/display-order";

/**
 * 指定されたカテゴリー内のアプリ一覧を取得する
 * @param categoryId カテゴリーID
 * @param excludeId 除外するアプリID（編集時に自分自身を除外するため）
 * @returns アプリ一覧（id, name, display_order）
 */
export async function getApplicationsByCategory(
  categoryId: number,
  excludeId?: number
): Promise<CategoryItemType[]> {
  return getItemsByCategory("applications", categoryId, excludeId);
}

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
 * @param ApplicationInsertFormType アプリのデータ
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
  position,
}: ApplicationInsertFormType) {
  // 配置位置から display_order を計算
  const display_order = await calculateDisplayOrder("applications", category_id, position);

  // 新規アプリを挿入する前に、指定位置以降のアプリの display_order を +1 する
  if (position.type === "first" || position.type === "after") {
    await shiftDisplayOrder("applications", category_id, display_order);
  }

  const supabase = createClientSupabaseClient();
  const { error } = await supabase.from("applications").insert([
    {
      name,
      category_id,
      description,
      url,
      developer_id,
      display_order,
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

  // 登録後、カテゴリー内の display_order を振り直す
  await reorderItemsInCategory("applications", category_id);

  return { success: true, error: null };
}

/**
 * サーバーサイドでアプリを更新する
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
  position,
}: ApplicationUpdateFormType) {
  const supabase = createClientSupabaseClient();

  // 現在のアプリ情報を取得（現在のdisplay_orderとcategory_idを知るため）
  const { data: currentApp } = await supabase
    .from("applications")
    .select("display_order, category_id")
    .eq("id", id)
    .single();

  const currentDisplayOrder = currentApp?.display_order;
  const currentCategoryId = currentApp?.category_id;

  // 新しい display_order を計算（編集時は自分自身を除外して計算）
  const display_order = await calculateDisplayOrder(
    "applications",
    category_id,
    position,
    currentDisplayOrder
  );

  // アプリを更新する前に、指定位置以降のアプリの display_order を +1 する
  if (position.type === "first" || position.type === "after") {
    await shiftDisplayOrder("applications", category_id, display_order, id);
  }

  const { error } = await supabase
    .from("applications")
    .update({
      name,
      category_id,
      description,
      url,
      developer_id,
      display_order,
      updated_by,
    })
    .eq("id", id);

  // エラーが発生した場合はコンソールにエラーメッセージを出力
  if (error) {
    console.error("Supabase アプリ更新エラー:", error.message);
    return { success: false, error };
  }

  // 更新後、カテゴリー内の display_order を振り直す
  await reorderItemsInCategory("applications", category_id);

  // カテゴリーが変更された場合、元のカテゴリーも振り直す
  if (currentCategoryId && currentCategoryId !== category_id) {
    await reorderItemsInCategory("applications", currentCategoryId);
  }

  return { success: true, error: null };
}
