/**
 * ファイル概要: コンテンツ表示順（display_order）操作の共通ユーティリティ
 *
 * 処理内容:
 * - カテゴリー内アイテム一覧の取得（`getItemsByCategory`）
 * - 配置位置（first/after/last/current）から表示順を算出（`calculateDisplayOrder`）
 * - 指定位置以降の表示順シフト（`shiftDisplayOrder`）
 * - カテゴリー内再採番（`reorderItemsInCategory`）
 *
 * 主な関数:
 * - `getItemsByCategory(table, categoryId, excludeId?)`
 * - `calculateDisplayOrder(table, categoryId, position, currentDisplayOrder?)`
 * - `shiftDisplayOrder(table, categoryId, displayOrder, excludeId?)`
 * - `reorderItemsInCategory(table, categoryId, options?)`
 *
 * 依存関係:
 * - `createClientSupabaseClient`（Supabase クライアント生成）
 * - `@/app/types`（`ContentTableType` などの共通型）
 */
import { createClientSupabaseClient } from "../supabase-client";
import type { CategoryItemType, ContentTableType, PlacementPositionType } from "@/app/types";

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
  let query;

  if (table === "documents") {
    query = supabase
      .from("documents")
      .select(
        "id,name,display_order,assignee_id,assignee:users!documents_assignee_fk(display_name)"
      );
  } else if (table === "videos") {
    query = supabase
      .from("videos")
      .select("id,name,display_order,assignee_id,assignee:users!videos_assignee_fk(display_name)");
  } else {
    query = supabase.from("applications").select("id,name,display_order");
  }

  query = query
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

  return (data ?? []) as CategoryItemType[];
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
  currentDisplayOrder?: number
): Promise<number> {
  if (position.type === "current" && currentDisplayOrder !== undefined) {
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

    const maxOrder = data?.[0]?.display_order ?? 0;
    return maxOrder + 1;
  }

  if (position.type === "after") {
    const { data } = await supabase
      .from(table)
      .select("display_order")
      .eq("id", position.afterId)
      .single();

    const afterOrder = data?.display_order ?? 0;
    return afterOrder + 1;
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
        .update({ display_order: item.display_order + 1 })
        .eq("id", item.id);
    }
  }
}

/**
 * カテゴリー内のアイテムの display_order を 1 から振り直す
 * @param table テーブル名
 * @param categoryId カテゴリーID
 * @param options includeDeletedInSelection=true の場合、取得時は削除済みを含める（再採番対象は未削除のみ）
 */
export async function reorderItemsInCategory(
  table: ContentTableType,
  categoryId: number,
  options?: { includeDeletedInSelection?: boolean }
): Promise<void> {
  const includeDeletedInSelection = options?.includeDeletedInSelection ?? false;
  const supabase = createClientSupabaseClient();

  // カテゴリー内のアイテムを display_order の昇順で取得
  let query = supabase.from(table).select("id, is_deleted").eq("category_id", categoryId);

  if (!includeDeletedInSelection) {
    query = query.eq("is_deleted", false);
  }

  const { data: items, error: selectError } = await query.order("display_order", {
    ascending: true,
  });

  if (selectError) {
    throw new Error(`並び順再採番対象の取得に失敗しました: ${selectError.message}`);
  }

  if (!items || items.length === 0) {
    return;
  }

  const itemsToReorder = includeDeletedInSelection
    ? items.filter(item => !item.is_deleted)
    : items;

  if (itemsToReorder.length === 0) {
    return;
  }

  // 1 から順に振り直す（衝突を避けるため順次更新）
  for (const [index, item] of itemsToReorder.entries()) {
    const { error: updateError } = await supabase
      .from(table)
      .update({ display_order: index + 1 })
      .eq("id", item.id);

    if (updateError) {
      throw new Error(`並び順再採番に失敗しました(id: ${item.id}): ${updateError.message}`);
    }
  }
}
