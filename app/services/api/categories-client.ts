/**
 * カテゴリー管理 - クライアント側データアクセス層
 *
 * 処理概要:
 * - Supabaseのカテゴリーテーブルに対するCRUD操作を提供
 * - 表示順序（display_order）の自動計算・シフト処理により、カテゴリーの並び順を保証
 * - カテゴリー削除時は、該当コンテンツを「未分類」に自動移動
 * - コンテンツ種別（documents/videos/applications）ごとの操作に対応
 *
 * 主要な責務:
 * 1. カテゴリー情報の取得（getCategoriesByType）
 * 2. カテゴリーの登録・更新・削除（registerCategory / updateCategory / deleteCategory）
 * 3. 表示順序の計算と自動シフト（calculateCategoryDisplayOrder / shiftCategoryDisplayOrder）
 * 4. 並び順の再採番（reorderCategoriesByType / reorderContentItemsInCategory）
 *
 * 依存関係:
 * - supabase-client: Supabaseクライアント生成
 * - @/app/types: CategoryInsertFormType, CategoryUpdateFormType, CategoryItemType, CategoryTypeValue
 *
 * 関数一覧:
 * ├─ [内部] getCategoriesByType() - 指定タイプのカテゴリー一覧取得
 * ├─ [公開] getCategoriesForPosition() - 位置指定フォーム用のカテゴリー一覧取得
 * ├─ [内部] calculateCategoryDisplayOrder() - 挿入位置から表示順序を計算
 * ├─ [内部] shiftCategoryDisplayOrder() - 指定順序以上のカテゴリーの順序をシフト
 * ├─ [内部] reorderCategoriesByType() - カテゴリーの並び順を1からリセット
 * ├─ [内部] reorderContentItemsInCategory() - 特定カテゴリー内のコンテンツ並び順をリセット
 * ├─ [公開] registerCategory() - カテゴリー登録
 * ├─ [公開] updateCategory() - カテゴリー更新
 * ├─ [内部] getTableNameByType() - カテゴリータイプからテーブル名に変換
 * └─ [公開] deleteCategory() - カテゴリー削除（コンテンツは未分類に移動）
 */
import { createClientSupabaseClient } from "./supabase-client";
import type {
  CategoryInsertFormType,
  CategoryItemType,
  CategoryTypeValue,
  CategoryUpdateFormType,
} from "@/app/types";

const UNCLASSIFIED_CATEGORY_NAME = "未分類";

async function getCategoriesByType(
  categoryType: CategoryTypeValue,
  excludeId?: number
): Promise<CategoryItemType[]> {
  const supabase = createClientSupabaseClient();
  let query = supabase
    .from("categories")
    .select("id, name, display_order")
    .eq("category_type", categoryType)
    .eq("is_deleted", false)
    .order("display_order", { ascending: true });

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("カテゴリー一覧取得エラー:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getCategoriesForPosition(
  categoryType: CategoryTypeValue,
  excludeId?: number
): Promise<CategoryItemType[]> {
  return getCategoriesByType(categoryType, excludeId);
}

async function calculateCategoryDisplayOrder(
  categoryType: CategoryTypeValue,
  position: CategoryInsertFormType["position"],
  currentDisplayOrder?: number
): Promise<number> {
  if (position.type === "current" && currentDisplayOrder !== undefined) {
    return currentDisplayOrder;
  }

  if (position.type === "first") {
    return 1;
  }

  const supabase = createClientSupabaseClient();

  if (position.type === "last") {
    const { data, error } = await supabase
      .from("categories")
      .select("display_order")
      .eq("category_type", categoryType)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`表示順の取得に失敗しました: ${error.message}`);
    }

    const maxDisplayOrder = data?.[0]?.display_order ?? 0;
    return maxDisplayOrder + 1;
  }

  if (position.type === "after") {
    const { data, error } = await supabase
      .from("categories")
      .select("display_order")
      .eq("id", position.afterId)
      .eq("category_type", categoryType)
      .eq("is_deleted", false)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "挿入位置のカテゴリーが見つかりません。", {
        cause: error,
      });
    }

    const afterDisplayOrder = data.display_order;
    return afterDisplayOrder + 1;
  }

  return 1;
}

async function shiftCategoryDisplayOrder(
  categoryType: CategoryTypeValue,
  displayOrder: number,
  excludeId?: number
): Promise<void> {
  const supabase = createClientSupabaseClient();

  let query = supabase
    .from("categories")
    .select("id, display_order")
    .eq("category_type", categoryType)
    .eq("is_deleted", false)
    .gte("display_order", displayOrder)
    .order("display_order", { ascending: false });

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data: affectedCategories, error: selectError } = await query;

  if (selectError) {
    throw new Error(`表示順更新対象の取得に失敗しました: ${selectError.message}`);
  }

  if (!affectedCategories || affectedCategories.length === 0) {
    return;
  }

  for (const category of affectedCategories) {
    const { error } = await supabase
      .from("categories")
      .update({ display_order: category.display_order + 1 })
      .eq("id", category.id);

    if (error) {
      throw new Error(`表示順更新に失敗しました(id: ${category.id}): ${error.message}`);
    }
  }
}

async function reorderCategoriesByType(categoryType: CategoryTypeValue): Promise<void> {
  const supabase = createClientSupabaseClient();

  const { data: categories, error: selectError } = await supabase
    .from("categories")
    .select("id")
    .eq("category_type", categoryType)
    .eq("is_deleted", false)
    .order("display_order", { ascending: true });

  if (selectError) {
    throw new Error(`並び順再採番対象の取得に失敗しました: ${selectError.message}`);
  }

  if (!categories || categories.length === 0) {
    return;
  }

  for (const [index, category] of categories.entries()) {
    const { error } = await supabase
      .from("categories")
      .update({ display_order: index + 1 })
      .eq("id", category.id);

    if (error) {
      throw new Error(`並び順再採番に失敗しました(id: ${category.id}): ${error.message}`);
    }
  }
}

async function reorderContentItemsInCategory(
  categoryType: CategoryTypeValue,
  categoryId: number
): Promise<void> {
  const supabase = createClientSupabaseClient();
  const tableName = getTableNameByType(categoryType);

  const { data: items, error: selectError } = await supabase
    .from(tableName)
    .select("id")
    .eq("category_id", categoryId)
    .eq("is_deleted", false)
    .order("display_order", { ascending: true });

  if (selectError) {
    throw new Error(`コンテンツ再採番対象の取得に失敗しました: ${selectError.message}`);
  }

  if (!items || items.length === 0) {
    return;
  }

  for (const [index, item] of items.entries()) {
    const { error } = await supabase
      .from(tableName)
      .update({ display_order: index + 1 })
      .eq("id", item.id);

    if (error) {
      throw new Error(`コンテンツ再採番に失敗しました(id: ${item.id}): ${error.message}`);
    }
  }
}

export async function registerCategory({
  category_type,
  name,
  description,
  position,
}: CategoryInsertFormType) {
  try {
    const display_order = await calculateCategoryDisplayOrder(category_type, position);

    if (position.type === "first" || position.type === "after") {
      await shiftCategoryDisplayOrder(category_type, display_order);
    }

    const supabase = createClientSupabaseClient();
    const { error } = await supabase.from("categories").insert([
      {
        category_type,
        name,
        description,
        display_order,
        is_deleted: false,
      },
    ]);

    if (error) {
      return { success: false, error };
    }

    await reorderCategoriesByType(category_type);

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("カテゴリー登録に失敗しました。"),
    };
  }
}

export async function updateCategory({
  id,
  category_type,
  name,
  description,
  position,
}: CategoryUpdateFormType) {
  try {
    const supabase = createClientSupabaseClient();

    const { data: currentCategory, error: currentCategoryError } = await supabase
      .from("categories")
      .select("display_order, category_type")
      .eq("id", id)
      .single();

    if (currentCategoryError || !currentCategory) {
      return {
        success: false,
        error: currentCategoryError ?? new Error("更新対象のカテゴリーが見つかりません。"),
      };
    }

    const currentDisplayOrder = currentCategory.display_order;
    const currentCategoryType = currentCategory.category_type as CategoryTypeValue;

    const display_order = await calculateCategoryDisplayOrder(
      category_type,
      position,
      currentDisplayOrder
    );

    if (position.type === "first" || position.type === "after") {
      await shiftCategoryDisplayOrder(category_type, display_order, id);
    }

    const { error } = await supabase
      .from("categories")
      .update({
        category_type,
        name,
        description,
        display_order,
      })
      .eq("id", id);

    if (error) {
      return { success: false, error };
    }

    await reorderCategoriesByType(category_type);

    if (currentCategoryType !== category_type) {
      await reorderCategoriesByType(currentCategoryType);
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("カテゴリー更新に失敗しました。"),
    };
  }
}

function getTableNameByType(
  categoryType: CategoryTypeValue
): "documents" | "videos" | "applications" {
  if (categoryType === "documents") {
    return "documents";
  }

  if (categoryType === "videos") {
    return "videos";
  }

  return "applications";
}

export async function deleteCategory(id: number, categoryType: CategoryTypeValue) {
  try {
    const supabase = createClientSupabaseClient();

    const { data: deletingCategory, error: categoryError } = await supabase
      .from("categories")
      .select("id, name, category_type")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (categoryError || !deletingCategory) {
      return { success: false, error: categoryError ?? new Error("削除対象が見つかりません。") };
    }

    if (deletingCategory.category_type !== categoryType) {
      return {
        success: false,
        error: new Error("削除対象のカテゴリー種別が一致しません。"),
      };
    }

    if (deletingCategory.name === UNCLASSIFIED_CATEGORY_NAME) {
      return { success: false, error: new Error("未分類カテゴリーは削除できません。") };
    }

    const { data: uncategorized, error: uncategorizedError } = await supabase
      .from("categories")
      .select("id")
      .eq("category_type", categoryType)
      .eq("name", UNCLASSIFIED_CATEGORY_NAME)
      .eq("is_deleted", false)
      .single();

    if (uncategorizedError || !uncategorized) {
      return {
        success: false,
        error: uncategorizedError ?? new Error("未分類カテゴリーが見つかりません。"),
      };
    }

    const tableName = getTableNameByType(categoryType);
    const { error: moveError } = await supabase
      .from(tableName)
      .update({ category_id: uncategorized.id })
      .eq("category_id", id)
      .eq("is_deleted", false);

    if (moveError) {
      return { success: false, error: moveError };
    }

    await reorderContentItemsInCategory(categoryType, uncategorized.id);

    const { error: deleteError } = await supabase
      .from("categories")
      .update({ is_deleted: true })
      .eq("id", id);

    if (deleteError) {
      return { success: false, error: deleteError };
    }

    await reorderCategoriesByType(categoryType);

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("カテゴリー削除に失敗しました。"),
    };
  }
}
