import { PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase-server";
import { TrashContentItem, TrashCategoryItem } from "@/app/types";

type RawTrashContentItem = {
  id: number;
  name: string;
  updated_at: string;
  category_id: number;
  category: { name: string }[] | { name: string } | null;
};

function transformToTrashContentItem(items: RawTrashContentItem[]): TrashContentItem[] {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    updated_at: item.updated_at,
    category_id: item.category_id,
    category: Array.isArray(item.category)
      ? item.category[0] ?? null
      : item.category,
  }));
}

/**
 * 削除済み資料を取得する（サーバーサイド用）
 * @returns { data: TrashContentItem[] | null, error: PostgrestError | null }
 */
export async function fetchDeletedDocuments(): Promise<{
  data: TrashContentItem[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, name, updated_at, category_id, category:categories(name)")
    .eq("is_deleted", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("削除済み資料取得エラー:", error.message);
    return { data: null, error };
  }

  return { data: transformToTrashContentItem(data as RawTrashContentItem[]), error: null };
}

/**
 * 削除済み動画を取得する（サーバーサイド用）
 * @returns { data: TrashContentItem[] | null, error: PostgrestError | null }
 */
export async function fetchDeletedVideos(): Promise<{
  data: TrashContentItem[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("videos")
    .select("id, name, updated_at, category_id, category:categories(name)")
    .eq("is_deleted", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("削除済み動画取得エラー:", error.message);
    return { data: null, error };
  }

  return { data: transformToTrashContentItem(data as RawTrashContentItem[]), error: null };
}

/**
 * 削除済みアプリを取得する（サーバーサイド用）
 * @returns { data: TrashContentItem[] | null, error: PostgrestError | null }
 */
export async function fetchDeletedApplications(): Promise<{
  data: TrashContentItem[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("applications")
    .select("id, name, updated_at, category_id, category:categories(name)")
    .eq("is_deleted", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("削除済みアプリ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data: transformToTrashContentItem(data as RawTrashContentItem[]), error: null };
}

/**
 * 削除済みカテゴリーを取得する（サーバーサイド用）
 * @returns { data: TrashCategoryItem[] | null, error: PostgrestError | null }
 */
export async function fetchDeletedCategories(): Promise<{
  data: TrashCategoryItem[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, updated_at, category_type")
    .eq("is_deleted", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("削除済みカテゴリー取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
