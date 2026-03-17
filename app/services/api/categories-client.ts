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
    const { data } = await supabase
      .from("categories")
      .select("display_order")
      .eq("category_type", categoryType)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false })
      .limit(1);

    const maxDisplayOrder = data?.[0]?.display_order ?? 0;
    return maxDisplayOrder + 1;
  }

  if (position.type === "after") {
    const { data } = await supabase
      .from("categories")
      .select("display_order")
      .eq("id", position.afterId)
      .single();

    const afterDisplayOrder = data?.display_order ?? 0;
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

  const { data: affectedCategories } = await query;

  if (!affectedCategories || affectedCategories.length === 0) {
    return;
  }

  for (const category of affectedCategories) {
    await supabase
      .from("categories")
      .update({ display_order: category.display_order + 1 })
      .eq("id", category.id);
  }
}

async function reorderCategoriesByType(categoryType: CategoryTypeValue): Promise<void> {
  const supabase = createClientSupabaseClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .eq("category_type", categoryType)
    .eq("is_deleted", false)
    .order("display_order", { ascending: true });

  if (!categories || categories.length === 0) {
    return;
  }

  for (const [index, category] of categories.entries()) {
    await supabase
      .from("categories")
      .update({ display_order: index + 1 })
      .eq("id", category.id);
  }
}

export async function registerCategory({
  category_type,
  name,
  description,
  position,
}: CategoryInsertFormType) {
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
    console.error("カテゴリー登録エラー:", error.message);
    return { success: false, error };
  }

  await reorderCategoriesByType(category_type);

  return { success: true, error: null };
}

export async function updateCategory({
  id,
  category_type,
  name,
  description,
  position,
}: CategoryUpdateFormType) {
  const supabase = createClientSupabaseClient();

  const { data: currentCategory } = await supabase
    .from("categories")
    .select("display_order, category_type")
    .eq("id", id)
    .single();

  const currentDisplayOrder = currentCategory?.display_order;
  const currentCategoryType = (currentCategory?.category_type ??
    category_type) as CategoryTypeValue;

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
    console.error("カテゴリー更新エラー:", error.message);
    return { success: false, error };
  }

  await reorderCategoriesByType(category_type);

  if (currentCategoryType !== category_type) {
    await reorderCategoriesByType(currentCategoryType);
  }

  return { success: true, error: null };
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
  const supabase = createClientSupabaseClient();

  const { data: deletingCategory, error: categoryError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (categoryError || !deletingCategory) {
    return { success: false, error: categoryError ?? new Error("削除対象が見つかりません。") };
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

  const { error: deleteError } = await supabase
    .from("categories")
    .update({ is_deleted: true })
    .eq("id", id);

  if (deleteError) {
    return { success: false, error: deleteError };
  }

  await reorderCategoriesByType(categoryType);

  return { success: true, error: null };
}
