import { VideoWithCategoryType } from "@/app/types";
import { createServerSupabaseClient } from "./supabase-server";
import { PostgrestError } from "@supabase/supabase-js";

export async function fetchVideos(): Promise<{
  data: VideoWithCategoryType[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("videos")
    .select(`*, category:categories (name)`)
    .eq("is_deleted", false)
    .order("display_order");

  if (error) {
    console.error("Supabase 動画一覧データ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function fetchVideoById(videoId: number): Promise<{
  data: VideoWithCategoryType | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("videos")
    .select(`*, category:categories(name)`)
    .eq("id", videoId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    console.error("Supabase 動画データ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
