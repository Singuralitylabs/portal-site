import { createClientSupabaseClient } from "./supabase-client";
import type {
  DocumentInsertFormType,
  DocumentUpdateFormType,
  PlacementPositionType,
} from "@/app/types";

/**
 * 指定されたカテゴリー内の資料一覧を取得する
 * @param categoryId カテゴリーID
 * @param excludeId 除外する資料ID（編集時に自分自身を除外するため）
 * @returns 資料一覧（id, name, display_order）
 */
export async function getDocumentsByCategory(
  categoryId: number,
  excludeId?: number
): Promise<{ id: number; name: string; display_order: number | null }[]> {
  const supabase = createClientSupabaseClient();
  let query = supabase
    .from("documents")
    .select("id, name, display_order")
    .eq("category_id", categoryId)
    .eq("is_deleted", false)
    .order("display_order", { ascending: true, nullsFirst: false });

  // 編集時は自分自身を除外
  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("資料一覧取得エラー:", error.message);
    return [];
  }

  return data || [];
}

/**
 * 配置位置から display_order を計算する
 * @param categoryId カテゴリーID
 * @param position 配置位置
 * @param currentDisplayOrder 現在の display_order（編集時）
 * @returns 計算された display_order
 */
export async function calculateDisplayOrder(
  categoryId: number,
  position: PlacementPositionType,
  currentDisplayOrder?: number | null
): Promise<number> {
  // 現在の位置を維持する場合
  if (position.type === "current" && currentDisplayOrder != null) {
    return currentDisplayOrder;
  }

  const supabase = createClientSupabaseClient();

  // 最初に配置
  if (position.type === "first") {
    return 1;
  }

  // 最後に配置
  if (position.type === "last") {
    const { data } = await supabase
      .from("documents")
      .select("display_order")
      .eq("category_id", categoryId)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false })
      .limit(1);

    return (data?.[0]?.display_order ?? 0) + 1;
  }

  // 特定の資料の後に配置
  if (position.type === "after") {
    const { data } = await supabase
      .from("documents")
      .select("display_order")
      .eq("id", position.afterId)
      .single();

    return (data?.display_order ?? 0) + 1;
  }

  return 1;
}

/**
 * 指定位置以降の資料の display_order を +1 する（共通処理）
 * @param categoryId カテゴリーID
 * @param displayOrder 基準となる display_order
 * @param excludeId 除外する資料ID（編集時に自分自身を除外するため）
 */
async function shiftDisplayOrder(
  categoryId: number,
  displayOrder: number,
  excludeId?: number
): Promise<void> {
  const supabase = createClientSupabaseClient();

  // 指定位置以降の資料を取得
  let query = supabase
    .from("documents")
    .select("id, display_order")
    .eq("category_id", categoryId)
    .eq("is_deleted", false)
    .gte("display_order", displayOrder)
    .order("display_order", { ascending: false }); // 降順で取得して後ろから更新

  // 編集時は自分自身を除外
  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data: affectedDocs } = await query;

  // 後ろから順に display_order を +1 する（衝突を避けるため）
  if (affectedDocs && affectedDocs.length > 0) {
    for (const doc of affectedDocs) {
      await supabase
        .from("documents")
        .update({ display_order: (doc.display_order ?? 0) + 1 })
        .eq("id", doc.id);
    }
  }
}

/**
 * カテゴリー内の資料の display_order を 1 から振り直す
 * @param categoryId カテゴリーID
 */
async function reorderDocumentsInCategory(categoryId: number): Promise<void> {
  const supabase = createClientSupabaseClient();

  // カテゴリー内の資料を display_order の昇順で取得（削除済みも含む）
  const { data: documents } = await supabase
    .from("documents")
    .select("id")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true, nullsFirst: false });

  if (!documents || documents.length === 0) {
    return;
  }

  // 1 から順に振り直す（並列実行でパフォーマンス改善）
  await Promise.all(
    documents.map((doc, index) =>
      supabase
        .from("documents")
        .update({ display_order: index + 1 })
        .eq("id", doc.id)
    )
  );
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
 * @param name 資料名
 * @param category_id カテゴリーID
 * @param description 説明文
 * @param url 資料URL
 * @param assignee 担当者
 * @param position 配置位置
 * @param created_by 作成者ID
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
  position,
}: DocumentInsertFormType) {
  const supabase = createClientSupabaseClient();

  // 配置位置から display_order を計算
  const display_order = await calculateDisplayOrder(category_id, position);

  // 新規資料を挿入する前に、指定位置以降の資料の display_order を +1 する
  if (position.type === "first" || position.type === "after") {
    await shiftDisplayOrder(category_id, display_order);
  }

  const { error } = await supabase.from("documents").insert([
    {
      name,
      category_id,
      description,
      url,
      assignee,
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
  await reorderDocumentsInCategory(category_id);

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
  const display_order = await calculateDisplayOrder(category_id, position, currentDisplayOrder);

  // 資料を更新する前に、指定位置以降の資料の display_order を +1 する
  if (position.type === "first" || position.type === "after") {
    await shiftDisplayOrder(category_id, display_order, id);
  }

  const { error } = await supabase
    .from("documents")
    .update({
      name,
      category_id,
      description,
      url,
      assignee,
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
  await reorderDocumentsInCategory(category_id);

  // カテゴリーが変更された場合、元のカテゴリーも振り直す
  if (currentCategoryId && currentCategoryId !== category_id) {
    await reorderDocumentsInCategory(currentCategoryId);
  }

  return { success: true, error: null };
}
