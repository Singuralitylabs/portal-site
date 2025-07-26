import { UserStatusType } from "@/app/types";
import { createServerSupabaseClient } from "./supabase-server";
import { PostgrestError } from "@supabase/supabase-js";
import { UUID } from "crypto";

/**
 * usersテーブルから指定のauth_idのユーザーのステータスを取得する（サーバーサイド用）
 * @param param0 - パラメータオブジェクト
 * @param {string} param0.authId - ユーザーの認証ID
 * @returns { status: UserStatusType | null, error: PostgrestError | null } - ユーザーステータスとエラー
 */
export async function fetchUserStatusByIdInServer({
  authId,
}: {
  authId: UUID | string;
}): Promise<{ status: UserStatusType | null; error: PostgrestError | null }> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("status")
    .eq("auth_id", authId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) {
    console.error("Supabase ユーザーステータス取得エラー:", error?.message || "No data found");
    return { status: null, error };
  }

  return { status: data.status, error: null };
}
