/**
 * ファイル概要: カテゴリー管理 API（クライアント側データアクセス層）
 *
 * 処理内容:
 * - カテゴリー一覧取得・登録・更新・削除を提供する
 * - `display_order` の計算/シフト/再採番を通じて表示順の整合性を維持する
 * - カテゴリー削除時に関連コンテンツを未分類へ移動し、移動先コンテンツとカテゴリ双方を再採番する
 *
 * 公開関数:
 * - `getCategoriesForPosition(categoryType, excludeId?)`
 * - `registerCategory(payload)`
 * - `updateCategory(payload)`
 * - `deleteCategory(id, categoryType)`
 *
 * 内部関数:
 * - `getCategoriesByType`, `calculateCategoryDisplayOrder`, `shiftCategoryDisplayOrder`,
 *   `reorderCategoriesByType`, `getTableNameByType`
 *
 * 依存関係:
 * - `createClientSupabaseClient`（Supabase クライアント生成）
 * - `reorderItemsInCategory`（共通再採番ユーティリティ）
 * - `@/app/types`（カテゴリ関連フォーム/型定義）
 */
import { createClientSupabaseClient } from "./supabase-client";
import type {
  CategoryInsertFormType,
  CategoryItemType,
  CategoryTypeValue,
  CategoryUpdateFormType,
} from "@/app/types";

const UNCLASSIFIED_CATEGORY_NAME = "未分類";

/**
 * カテゴリー種別ごとの一覧を display_order 昇順で取得する。
 * excludeId が指定された場合は対象IDを除外して返す。
 */
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

/**
 * 追加/更新フォームの position 指定から挿入先 display_order を算出する。
 */
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

/**
 * 指定 display_order 以降のカテゴリーを後ろへ1つずつシフトする。
 * 順序衝突を避けるため降順取得して逐次更新する。
 */
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

/**
 * 指定カテゴリー種別の display_order を 1 から連番に再採番する。
 */
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

/**
 * カテゴリーを新規登録し、必要に応じてシフト/再採番して整合性を保つ。
 */
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

/**
 * カテゴリー情報を更新し、表示順や種別変更に伴う再採番を実行する。
 */
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

/**
 * カテゴリー種別から対応するコンテンツテーブル名を解決する。
 */
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

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return new Error(message);
    }
  }

  return new Error(fallbackMessage);
}

async function rollbackContentMove(
  supabase: ReturnType<typeof createClientSupabaseClient>,
  tableName: "documents" | "videos" | "applications",
  movedContentIds: number[],
  originalCategoryId: number,
  uncategorizedId: number
) {
  if (movedContentIds.length === 0) {
    return null;
  }

  const { error } = await supabase
    .from(tableName)
    .update({ category_id: originalCategoryId })
    .in("id", movedContentIds)
    .eq("is_deleted", false)
    .eq("category_id", uncategorizedId);

  return error;
}

async function rollbackCategoryDeletion(
  supabase: ReturnType<typeof createClientSupabaseClient>,
  id: number
) {
  const { error } = await supabase.from("categories").update({ is_deleted: false }).eq("id", id);
  return error;
}

/**
 * カテゴリーを削除する。
 * 1) 対象コンテンツを未分類へ移動
 * 2) カテゴリー論理削除
 * 3) カテゴリー一覧再採番
 * の順で実行し、失敗時は可能な範囲でロールバックする。
 */
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
    const { data: contentsToMove, error: contentsToMoveError } = await supabase
      .from(tableName)
      .select("id")
      .eq("category_id", id)
      .eq("is_deleted", false);

    if (contentsToMoveError) {
      return { success: false, error: contentsToMoveError };
    }

    const movedContentIds = (contentsToMove ?? []).map(content => content.id);

    // Step 1: 紐づくコンテンツを未分類へ移動する。
    if (movedContentIds.length > 0) {
      const { data: movedContents, error: moveError } = await supabase
        .from(tableName)
        .update({ category_id: uncategorized.id })
        .in("id", movedContentIds)
        .eq("is_deleted", false)
        .eq("category_id", id)
        .select("id");

      if (moveError) {
        return { success: false, error: moveError };
      }

      const movedCount = movedContents?.length ?? 0;
      const expectedMoveCount = movedContentIds.length;

      if (movedCount !== expectedMoveCount) {
        const rollbackError = await rollbackContentMove(
          supabase,
          tableName,
          movedContentIds,
          id,
          uncategorized.id
        );

        if (rollbackError) {
          return { success: false, error: rollbackError };
        }

        return {
          success: false,
          error: new Error("コンテンツ移動件数の整合性チェックに失敗しました。"),
        };
      }
    }

    // Step 2: カテゴリーを論理削除する。失敗時は移動済みコンテンツを戻す。
    const { error: deleteError } = await supabase
      .from("categories")
      .update({ is_deleted: true })
      .eq("id", id);

    if (deleteError) {
      const rollbackError = await rollbackContentMove(
        supabase,
        tableName,
        movedContentIds,
        id,
        uncategorized.id
      );
      if (rollbackError) {
        return { success: false, error: rollbackError };
      }

      return { success: false, error: deleteError };
    }

    // Step 3: カテゴリー一覧を再採番する。失敗時は削除と移動を戻す。
    try {
      await reorderCategoriesByType(categoryType);
    } catch (reorderCategoriesError) {
      const rollbackDeleteError = await rollbackCategoryDeletion(supabase, id);
      if (rollbackDeleteError) {
        return { success: false, error: rollbackDeleteError };
      }

      const rollbackError = await rollbackContentMove(
        supabase,
        tableName,
        movedContentIds,
        id,
        uncategorized.id
      );
      if (rollbackError) {
        return { success: false, error: rollbackError };
      }

      return {
        success: false,
        error: toError(
          reorderCategoriesError,
          "カテゴリー再採番に失敗したため、削除処理をロールバックしました。"
        ),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("カテゴリー削除に失敗しました。"),
    };
  }
}
