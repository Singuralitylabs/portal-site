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
 * - `@/app/types`（カテゴリ関連フォーム/型定義）
 *
 * 処理ステップ（公開関数ごと）:
 * - `getCategoriesForPosition`: 1) 種別/除外IDを受け取る 2) 一覧取得関数へ委譲 3) 候補一覧を返す
 * - `registerCategory`: 1) 挿入位置計算 2) 必要なら既存順序をシフト 3) insert 4) 再採番/失敗時復旧
 * - `updateCategory`: 1) 現在値取得 2) 新しい位置計算 3) 必要ならシフト 4) update 5) 再採番
 * - `deleteCategory`: 1) 事前検証 2) 関連コンテンツ移動 3) 論理削除 4) 未分類側再採番 5) カテゴリ再採番
 */
import { createClientSupabaseClient } from "./supabase-client";
import type {
  CategoryInsertFormType,
  CategoryItemType,
  CategoryTypeValue,
  CategoryUpdateFormType,
} from "@/app/types";
import { reorderItemsInCategory } from "./utils/display-order";

// 論理的に削除不可のシステム予約カテゴリー名。
const UNCLASSIFIED_CATEGORY_NAME = "未分類";

/**
 * カテゴリー種別ごとの一覧を display_order 昇順で取得する。
 * excludeId が指定された場合は対象IDを除外して返す。
 */
async function getCategoriesByType(
  categoryType: CategoryTypeValue,
  excludeId?: number
): Promise<CategoryItemType[]> {
  // categoryType: documents/videos/applications の対象種別を示す。
  // excludeId: 編集時などに対象IDを一覧候補から除外したい場合に指定する。
  const supabase = createClientSupabaseClient();
  let query = supabase
    .from("categories")
    .select("id, name, display_order")
    .eq("category_type", categoryType)
    .eq("is_deleted", false)
    .order("display_order", { ascending: true });

  if (excludeId !== undefined) {
    // 除外IDが渡された場合のみ、候補一覧から除外する。
    query = query.neq("id", excludeId);
  }

  // 構築したクエリを実行して、エラー時は空配列を返す。
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
  // UI の表示位置選択候補を返すための薄いラッパー。
  // 実際の取得処理は getCategoriesByType に委譲する。
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
  // current 指定時は、更新前の表示順を維持する。
  if (position.type === "current" && currentDisplayOrder !== undefined) {
    return currentDisplayOrder;
  }

  // first 指定時は最上位の 1 を返す。
  if (position.type === "first") {
    return 1;
  }

  const supabase = createClientSupabaseClient();

  // last 指定時は、現在の最大表示順 + 1 を採用する。
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

  // after 指定時は、基準カテゴリーの直後（+1）に配置する。
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
  // displayOrder 以上の既存カテゴリーを後ろにずらして挿入余地を作る。
  // excludeId は更新対象自身をシフト対象から外すために利用する。
  const supabase = createClientSupabaseClient();

  let query = supabase
    .from("categories")
    .select("id, display_order")
    .eq("category_type", categoryType)
    .eq("is_deleted", false)
    .gte("display_order", displayOrder)
    .order("display_order", { ascending: false });

  if (excludeId !== undefined) {
    // 更新対象自身はシフト不要のため除外する。
    query = query.neq("id", excludeId);
  }

  // 影響対象を取得し、0件なら何もせず終了する。
  const { data: affectedCategories, error: selectError } = await query;

  if (selectError) {
    throw new Error(`表示順更新対象の取得に失敗しました: ${selectError.message}`);
  }

  if (!affectedCategories || affectedCategories.length === 0) {
    return;
  }

  try {
    for (const category of affectedCategories) {
      // 1件ずつ display_order を +1 して衝突を回避する。
      const { error } = await supabase
        .from("categories")
        .update({ display_order: category.display_order + 1 })
        .eq("id", category.id);

      if (error) {
        throw new Error(`表示順更新に失敗しました(id: ${category.id}): ${error.message}`);
      }
    }
  } catch (error) {
    // 部分更新が発生しうるため、失敗時は再採番でベストエフォート復旧する。
    try {
      await reorderCategoriesByType(categoryType);
    } catch (reorderError) {
      console.error("表示順更新失敗後の再採番復旧に失敗:", reorderError);
    }

    throw error instanceof Error ? error : new Error("表示順更新に失敗しました。");
  }
}

async function executeCategoryReorder(categoryType: CategoryTypeValue): Promise<void> {
  // 論理削除を除いたカテゴリーを表示順で取り出し、1 始まりの連番へ正規化する。
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
    // index は 0 始まりのため、DB の display_order は index + 1 を書き込む。
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
 * 指定カテゴリー種別の display_order を 1 から連番に再採番する。
 * 途中失敗時は部分更新の可能性があるため、1回だけ再試行して復旧を試みる。
 */
async function reorderCategoriesByType(categoryType: CategoryTypeValue): Promise<void> {
  try {
    await executeCategoryReorder(categoryType);
  } catch (error) {
    console.error("カテゴリー再採番に失敗。再試行で復旧を試みます:", error);

    try {
      await executeCategoryReorder(categoryType);
    } catch (retryError) {
      throw retryError instanceof Error
        ? retryError
        : new Error("カテゴリー再採番に失敗しました。");
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
    // didShiftDisplayOrder: insert 前に既存順序を動かしたかどうか。
    // true の場合のみ、insert 失敗時に復旧用再採番を試行する。
    let didShiftDisplayOrder = false;

    // Step 1: 入力 position から登録先の display_order を決定する。
    // display_order: 画面入力 position から計算された最終挿入位置。
    const display_order = await calculateCategoryDisplayOrder(category_type, position);

    // Step 2: 先頭/途中挿入なら、衝突回避のため既存順序を後ろへずらす。
    // first / after の場合は既存順序を後ろへずらす必要がある。
    if (position.type === "first" || position.type === "after") {
      await shiftCategoryDisplayOrder(category_type, display_order);
      didShiftDisplayOrder = true;
    }

    // Step 3: カテゴリ本体を insert する。
    const supabase = createClientSupabaseClient();
    // 実データを挿入する。is_deleted は論理削除フラグのため false で初期化する。
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
      // Step 3-1: シフト済みなら、失敗時にベストエフォート復旧を試行する。
      if (didShiftDisplayOrder) {
        try {
          await reorderCategoriesByType(category_type);
        } catch (reorderError) {
          console.error("カテゴリー登録失敗後の表示順復旧に失敗:", reorderError);
        }
      }

      return { success: false, error };
    }

    // Step 4: 成功時は最終的に display_order を正規化する。
    // 挿入後に並びを正規化してギャップや重複を解消する。
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
    // didShiftDisplayOrder: update 前に順序調整を行ったかを保持する。
    let didShiftDisplayOrder = false;

    // Step 1: 更新対象の現在値を取得する。
    const supabase = createClientSupabaseClient();

    // currentCategory: 更新対象の現状（表示順・種別）を保持する。
    const { data: currentCategory, error: currentCategoryError } = await supabase
      .from("categories")
      .select("display_order, category_type, name, description")
      .eq("id", id)
      .single();

    if (currentCategoryError || !currentCategory) {
      return {
        success: false,
        error: currentCategoryError ?? new Error("更新対象のカテゴリーが見つかりません。"),
      };
    }

    // 現在値を保持して、更新後の再採番条件判定に利用する。
    const currentDisplayOrder = currentCategory.display_order;
    const currentCategoryType = currentCategory.category_type as CategoryTypeValue;
    const currentName = currentCategory.name;
    const currentDescription = currentCategory.description;

    // フォーム入力 position から新しい表示順を算出する。
    // Step 2: 新しい表示順を計算する。
    const display_order = await calculateCategoryDisplayOrder(
      category_type,
      position,
      currentDisplayOrder
    );

    // Step 3: 先頭/途中挿入なら既存順序をシフトする。
    // first / after の場合は既存順序の退避（シフト）が必要。
    if (position.type === "first" || position.type === "after") {
      await shiftCategoryDisplayOrder(category_type, display_order, id);
      didShiftDisplayOrder = true;
    }

    // Step 4: カテゴリ本体を update する。
    // 対象レコード本体を更新する。
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
      // Step 4-1: シフト後の update 失敗時は表示順復旧を試行する。
      if (didShiftDisplayOrder) {
        try {
          await reorderCategoriesByType(category_type);
        } catch (reorderError) {
          console.error("カテゴリー更新失敗後の表示順復旧に失敗:", reorderError);
        }
      }

      return { success: false, error };
    }

    // Step 5: 更新後の再採番を実行する。失敗時は更新内容を元に戻す。
    try {
      // 更新先種別の並び順を正規化する。
      await reorderCategoriesByType(category_type);

      // 種別変更が発生した場合のみ、移動元種別側も再採番して整合を保つ。
      if (currentCategoryType !== category_type) {
        await reorderCategoriesByType(currentCategoryType);
      }
    } catch (reorderError) {
      const { error: rollbackUpdateError } = await supabase
        .from("categories")
        .update({
          category_type: currentCategoryType,
          name: currentName,
          description: currentDescription,
          display_order: currentDisplayOrder,
        })
        .eq("id", id);

      if (rollbackUpdateError) {
        return { success: false, error: rollbackUpdateError };
      }

      try {
        await reorderCategoriesByType(currentCategoryType);
        if (currentCategoryType !== category_type) {
          await reorderCategoriesByType(category_type);
        }
      } catch (rollbackReorderError) {
        return {
          success: false,
          error: toError(rollbackReorderError, "更新ロールバック後の再採番に失敗しました。"),
        };
      }

      return {
        success: false,
        error: toError(
          reorderError,
          "カテゴリー再採番に失敗したため、更新処理をロールバックしました。"
        ),
      };
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
  // categoryType と物理テーブル名の対応をここで一元化する。
  if (categoryType === "documents") {
    return "documents";
  }

  if (categoryType === "videos") {
    return "videos";
  }

  return "applications";
}

function toError(error: unknown, fallbackMessage: string): Error {
  // unknown を Error に正規化して、上位へ統一的に返す。
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
  // movedContentIds: Step1 で実際に移動対象だったコンテンツID群。
  // originalCategoryId / uncategorizedId: 戻し先・戻し元の category_id。
  if (movedContentIds.length === 0) {
    return null;
  }

  // 未分類へ移動済みのレコードのみを元カテゴリーへ戻す。
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
  // 論理削除を取り消して is_deleted=false に復旧する。
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
    // id: 削除対象カテゴリーID。
    // categoryType: 呼び出し元が期待する対象種別（誤削除防止に利用）。
    const supabase = createClientSupabaseClient();

    // Step 0-1: 削除対象の存在と現在状態を確認する。
    const { data: deletingCategory, error: categoryError } = await supabase
      .from("categories")
      .select("id, name, category_type")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (categoryError || !deletingCategory) {
      return { success: false, error: categoryError ?? new Error("削除対象が見つかりません。") };
    }

    // Step 0-2: 呼び出し側の種別と実データ種別が一致するか検証する。
    if (deletingCategory.category_type !== categoryType) {
      return {
        success: false,
        error: new Error("削除対象のカテゴリー種別が一致しません。"),
      };
    }

    // Step 0-3: 未分類カテゴリーは業務上の保護対象として削除禁止。
    if (deletingCategory.name === UNCLASSIFIED_CATEGORY_NAME) {
      return { success: false, error: new Error("未分類カテゴリーは削除できません。") };
    }

    // Step 0-4: 移動先として同種別の未分類カテゴリーを取得する。
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

    // tableName: categoryType に紐づく実テーブル名（documents/videos/applications）。
    const tableName = getTableNameByType(categoryType);

    // Step 0-5: 削除対象カテゴリーに紐づくコンテンツIDを事前取得する。
    // movedContentIds は移動件数確認とロールバック範囲の基準になる。
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
      // movedContents: UPDATE + select("id") の戻り値。実際に更新された件数確認に利用する。
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

      // 移動対象件数と実更新件数が一致しない場合は部分更新を戻して失敗とする。
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

      // 移動後の残存件数と移動済み件数を再確認して、競合による不整合を防ぐ。
      const { data: movedToUncategorizedContents, error: movedToUncategorizedCheckError } =
        await supabase
          .from(tableName)
          .select("id")
          .in("id", movedContentIds)
          .eq("is_deleted", false)
          .eq("category_id", uncategorized.id);

      if (movedToUncategorizedCheckError) {
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

        return { success: false, error: movedToUncategorizedCheckError };
      }

      const { data: remainingOriginalContents, error: remainingOriginalCheckError } = await supabase
        .from(tableName)
        .select("id")
        .eq("category_id", id)
        .eq("is_deleted", false);

      if (remainingOriginalCheckError) {
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

        return { success: false, error: remainingOriginalCheckError };
      }

      if (
        (movedToUncategorizedContents?.length ?? 0) !== expectedMoveCount ||
        (remainingOriginalContents?.length ?? 0) !== 0
      ) {
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
          error: new Error("コンテンツ移動後の整合性チェックに失敗しました。"),
        };
      }
    }

    // Step 2: カテゴリーを論理削除する。失敗時は移動済みコンテンツを戻す。
    const { error: deleteError } = await supabase
      .from("categories")
      .update({ is_deleted: true })
      .eq("id", id);

    if (deleteError) {
      // 論理削除に失敗したら、先に動かしたコンテンツを元に戻して整合を保つ。
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

    // 移動先（未分類）側の表示順も再採番して重複や欠番を防ぐ。
    if (movedContentIds.length > 0) {
      try {
        await reorderItemsInCategory(tableName, uncategorized.id);
      } catch (reorderUncategorizedError) {
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

        // 未分類側再採番の部分更新を元カテゴリへ持ち帰る可能性があるため、
        // ロールバック後に双方を再採番して display_order を正規化する。
        try {
          await reorderItemsInCategory(tableName, id);
          await reorderItemsInCategory(tableName, uncategorized.id);
        } catch (normalizeOrderError) {
          return {
            success: false,
            error: toError(
              normalizeOrderError,
              "ロールバック後の表示順正規化に失敗しました。"
            ),
          };
        }

        return {
          success: false,
          error: toError(
            reorderUncategorizedError,
            "移動先コンテンツ再採番に失敗したため、削除処理をロールバックしました。"
          ),
        };
      }
    }

    // Step 3: カテゴリー一覧を再採番する。失敗時は削除と移動を戻す。
    try {
      await reorderCategoriesByType(categoryType);
    } catch (reorderCategoriesError) {
      // 再採番失敗時は、論理削除を先に戻す。
      const rollbackDeleteError = await rollbackCategoryDeletion(supabase, id);
      if (rollbackDeleteError) {
        return { success: false, error: rollbackDeleteError };
      }

      // 続いてコンテンツ移動も戻し、操作全体を取り消す。
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

      if (movedContentIds.length > 0) {
        // 直前の未分類側再採番結果が残る可能性があるため、
        // ロールバック後に元カテゴリ/未分類の双方を再採番して正規化する。
        try {
          await reorderItemsInCategory(tableName, id);
          await reorderItemsInCategory(tableName, uncategorized.id);
        } catch (normalizeOrderError) {
          return {
            success: false,
            error: toError(
              normalizeOrderError,
              "ロールバック後の表示順正規化に失敗しました。"
            ),
          };
        }
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
