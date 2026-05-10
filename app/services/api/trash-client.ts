import { PostgrestError } from "@supabase/supabase-js";
import { createClientSupabaseClient } from "./supabase-client";

type RestoreResult = {
  success: boolean;
  error: Error | PostgrestError | null;
};

/**
 * 削除済み資料を復活する
 * @param id - 資料ID
 * @param userId - 操作ユーザーID
 * @returns { success: boolean, error: Error | PostgrestError | null }
 */
export async function restoreDocument(id: number, userId: number): Promise<RestoreResult> {
  const supabase = createClientSupabaseClient();

  try {
    // 1. 復活対象の資料情報を取得
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("category_id")
      .eq("id", id)
      .eq("is_deleted", true)
      .single();

    if (fetchError || !doc) {
      return { success: false, error: fetchError ?? new Error("復活対象が見つかりません") };
    }

    // 2. 同カテゴリー内の最大display_orderを取得
    const { data: maxOrderData } = await supabase
      .from("documents")
      .select("display_order")
      .eq("category_id", doc.category_id)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false })
      .limit(1);

    const newDisplayOrder = (maxOrderData?.[0]?.display_order ?? 0) + 1;

    // 3. 復活処理
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        is_deleted: false,
        display_order: newDisplayOrder,
        updated_by: userId,
      })
      .eq("id", id)
      .eq("is_deleted", true);

    if (updateError) {
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("復活処理に失敗しました"),
    };
  }
}

/**
 * 削除済み動画を復活する
 * @param id - 動画ID
 * @param userId - 操作ユーザーID
 * @returns { success: boolean, error: Error | PostgrestError | null }
 */
export async function restoreVideo(id: number, userId: number): Promise<RestoreResult> {
  const supabase = createClientSupabaseClient();

  try {
    // 1. 復活対象の動画情報を取得
    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("category_id")
      .eq("id", id)
      .eq("is_deleted", true)
      .single();

    if (fetchError || !video) {
      return { success: false, error: fetchError ?? new Error("復活対象が見つかりません") };
    }

    // 2. 同カテゴリー内の最大display_orderを取得
    const { data: maxOrderData } = await supabase
      .from("videos")
      .select("display_order")
      .eq("category_id", video.category_id)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false })
      .limit(1);

    const newDisplayOrder = (maxOrderData?.[0]?.display_order ?? 0) + 1;

    // 3. 復活処理
    const { error: updateError } = await supabase
      .from("videos")
      .update({
        is_deleted: false,
        display_order: newDisplayOrder,
        updated_by: userId,
      })
      .eq("id", id)
      .eq("is_deleted", true);

    if (updateError) {
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("復活処理に失敗しました"),
    };
  }
}

/**
 * 削除済みアプリを復活する
 * @param id - アプリID
 * @param userId - 操作ユーザーID
 * @returns { success: boolean, error: Error | PostgrestError | null }
 */
export async function restoreApplication(id: number, userId: number): Promise<RestoreResult> {
  const supabase = createClientSupabaseClient();

  try {
    // 1. 復活対象のアプリ情報を取得
    const { data: app, error: fetchError } = await supabase
      .from("applications")
      .select("category_id")
      .eq("id", id)
      .eq("is_deleted", true)
      .single();

    if (fetchError || !app) {
      return { success: false, error: fetchError ?? new Error("復活対象が見つかりません") };
    }

    // 2. 同カテゴリー内の最大display_orderを取得
    const { data: maxOrderData } = await supabase
      .from("applications")
      .select("display_order")
      .eq("category_id", app.category_id)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false })
      .limit(1);

    const newDisplayOrder = (maxOrderData?.[0]?.display_order ?? 0) + 1;

    // 3. 復活処理
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        is_deleted: false,
        display_order: newDisplayOrder,
        updated_by: userId,
      })
      .eq("id", id)
      .eq("is_deleted", true);

    if (updateError) {
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("復活処理に失敗しました"),
    };
  }
}

/**
 * 削除済みカテゴリーを復活する
 * @param id - カテゴリーID
 * @returns { success: boolean, error: Error | PostgrestError | null }
 */
export async function restoreCategory(id: number): Promise<RestoreResult> {
  const supabase = createClientSupabaseClient();

  try {
    // 1. 復活対象のカテゴリー情報を取得
    const { data: category, error: fetchError } = await supabase
      .from("categories")
      .select("category_type")
      .eq("id", id)
      .eq("is_deleted", true)
      .single();

    if (fetchError || !category) {
      return { success: false, error: fetchError ?? new Error("復活対象が見つかりません") };
    }

    // 2. 同種別内の最大display_orderを取得
    const { data: maxOrderData } = await supabase
      .from("categories")
      .select("display_order")
      .eq("category_type", category.category_type)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false })
      .limit(1);

    const newDisplayOrder = (maxOrderData?.[0]?.display_order ?? 0) + 1;

    // 3. 復活処理
    const { error: updateError } = await supabase
      .from("categories")
      .update({
        is_deleted: false,
        display_order: newDisplayOrder,
      })
      .eq("id", id)
      .eq("is_deleted", true);

    if (updateError) {
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("復活処理に失敗しました"),
    };
  }
}
