import { createClientSupabaseClient } from "../supabase-client";
import type { CategoryItemType, ContentTableType, PlacementPositionType } from "@/app/types";

/**
 * 表示順操作の共通型定義と関数
 */

/**
 * 指定されたカテゴリー内のアイテム一覧を取得する
 * @param table テーブル名
 * @param categoryId カテゴリーID
 * @param excludeId 除外するアイテムID（編集時に自分自身を除外するため）
 * @returns アイテム一覧（id, name, display_order）
 */
export async function getItemsByCategory(
  table: ContentTableType,
  categoryId: number,
  excludeId?: number
): Promise<CategoryItemType[]> {
  const supabase = createClientSupabaseClient();
  let query = supabase
    .from(table)
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
    console.error(`${table}一覧取得エラー:`, error.message);
    return [];
  }

  return data || [];
}

/**
 * 配置位置から display_order を計算する
 * @param table テーブル名
 * @param categoryId カテゴリーID
 * @param position 配置位置
 * @param currentDisplayOrder 現在の display_order（編集時）
 * @returns 計算された display_order
 */
export async function calculateDisplayOrder(
  table: ContentTableType,
  categoryId: number,
  position: PlacementPositionType,
  currentDisplayOrder?: number | null
): Promise<number> {
  if (
    position.type === "current" &&
    currentDisplayOrder !== null &&
    currentDisplayOrder !== undefined
  ) {
    return currentDisplayOrder;
  }

  const supabase = createClientSupabaseClient();

  if (position.type === "first") {
    return 1;
  }

  if (position.type === "last") {
    const { data } = await supabase
      .from(table)
      .select("display_order")
      .eq("category_id", categoryId)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false })
      .limit(1);

    const maxOrder = data?.[0]?.display_order;
    return maxOrder !== null && maxOrder !== undefined ? maxOrder + 1 : 1;
  }

  if (position.type === "after") {
    const { data } = await supabase
      .from(table)
      .select("display_order")
      .eq("id", position.afterId)
      .single();

    const afterOrder = data?.display_order;
    return afterOrder !== null && afterOrder !== undefined ? afterOrder + 1 : 1;
  }

  return 1;
}

/**
 * 指定位置以降のアイテムの display_order を +1 する（共通処理）
 * @param table テーブル名
 * @param categoryId カテゴリーID
 * @param displayOrder 基準となる display_order
 * @param excludeId 除外するアイテムID（編集時に自分自身を除外するため）
 */
export async function shiftDisplayOrder(
  table: ContentTableType,
  categoryId: number,
  displayOrder: number,
  excludeId?: number
): Promise<void> {
  const supabase = createClientSupabaseClient();

  // 指定位置以降のアイテムを取得
  let query = supabase
    .from(table)
    .select("id, display_order")
    .eq("category_id", categoryId)
    .eq("is_deleted", false)
    .gte("display_order", displayOrder)
    .order("display_order", { ascending: false }); // 降順で取得して後ろから更新

  // 編集時は自分自身を除外
  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data: affectedItems } = await query;

  // 後ろから順に display_order を +1 する（衝突を避けるため）
  if (affectedItems && affectedItems.length > 0) {
    for (const item of affectedItems) {
      await supabase
        .from(table)
        .update({ display_order: (item.display_order ?? 0) + 1 })
        .eq("id", item.id);
    }
  }
}

/**
 * カテゴリー内のアイテムの display_order を 1 から振り直す
 * @param table テーブル名
 * @param categoryId カテゴリーID
 */
export async function reorderItemsInCategory(
  table: ContentTableType,
  categoryId: number
): Promise<void> {
  const supabase = createClientSupabaseClient();

  // カテゴリー内のアイテムを display_order の昇順で取得（削除済みも含む）
  const { data: items } = await supabase
    .from(table)
    .select("id")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true, nullsFirst: false });

  if (!items || items.length === 0) {
    return;
  }

  // 1 から順に振り直す（並列実行でパフォーマンス改善）
  await Promise.all(
    items.map((item, index) =>
      supabase
        .from(table)
        .update({ display_order: index + 1 })
        .eq("id", item.id)
    )
  );
}
