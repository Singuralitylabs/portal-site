import { UserStatusType } from "@/app/types";
import { getCurrentUser, createServerSupabaseClient } from "./supabase-server";
import type { PostgrestError } from "@supabase/supabase-js";
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

/**
 * サーバーサイドで現在アクセスしているユーザー情報（usersテーブルの型）を取得する
 */
export async function getCurrentUserRole() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }

  // usersテーブルから追加情報を取得
  const { data: userProfile, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", data.user.id)
    .single();

  return { role: userProfile?.role, userError };
}

/**
 * usersテーブルからauth_idでユーザーのroleを取得する
 * @param authId - 省略時は現在のユーザーのauth_idを自動取得
 * @returns { role: string | null, error: PostgrestError | null }
 */
export async function fetchUserRoleByAuthId(
  authId?: string
): Promise<{ role: string | null; error: PostgrestError | null }> {
  let targetAuthId = authId;
  if (!targetAuthId) {
    const currentUser = await getCurrentUser();
    if (!currentUser?.auth_id) {
      return { role: null, error: null };
    }
    targetAuthId = currentUser.auth_id;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", targetAuthId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) {
    return { role: null, error };
  }

  return { role: data.role, error: null };
}
