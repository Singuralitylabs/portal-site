import { MemberType, PendingUserType, UserStatusType, UserType } from "@/app/types";
import { createServerSupabaseClient } from "./supabase-server";
import { PostgrestError } from "@supabase/supabase-js";
import { UUID } from "crypto";
import { USER_STATUS } from "@/app/constants/user";

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
 * usersテーブルから指定のauth_idのユーザーの情報（id, role）を取得する（サーバーサイド用）
 * @param param0 - パラメータオブジェクト
 * @param {string} param0.authId - ユーザーの認証ID（必須）
 * @returns { id: number, role: string, error: PostgrestError | null } - ユーザーID・ロールとエラー
 */
export async function fetchUserInfoByAuthId({
  authId,
}: {
  authId: string;
}): Promise<{ id: number; role: string; error: PostgrestError | null }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", authId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) {
    console.error("Supabase ユーザー情報取得エラー:", error?.message || "No data found");
    return { id: 0, role: "", error };
  }

  return { id: data.id, role: data.role, error: null };
}

/**
 * 会員一覧を取得する
 * @returns { data: MemberType[] | null, error: PostgrestError | null } - 会員一覧とエラー
 */
export async function fetchActiveUsers(): Promise<{
  data: MemberType[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, display_name, bio, avatar_url, x_url, facebook_url, instagram_url, github_url, portfolio_url"
    )
    .eq("status", "active")
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase 会員一覧取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * 承認待ちユーザー一覧を取得する
 * @returns { data: PendingUserType[] | null, error: PostgrestError | null } - 承認待ちユーザー一覧とエラー
 */
export async function fetchApprovalUsers(): Promise<{
  data: PendingUserType[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, email")
    .eq("is_deleted", false)
    .eq("status", USER_STATUS.PENDING);

  if (error) {
    console.error("Supabase 承認待ちユーザー一覧取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * usersテーブルから指定のauth_idのユーザーの完全な情報を取得する（サーバーサイド用）
 * @param param0 - パラメータオブジェクト
 * @param {string} param0.authId - ユーザーの認証ID（必須）
 * @returns { data: UserType | null, error: PostgrestError | null } - ユーザー情報とエラー
 */
export async function fetchUserByAuthIdInServer({
  authId,
}: {
  authId: string;
}): Promise<{ data: UserType | null; error: PostgrestError | null }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) {
    console.error("Supabase ユーザー情報取得エラー:", error?.message);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * usersテーブルのユーザープロフィールを更新する（サーバーサイド用）
 * @param param0 - パラメータオブジェクト
 * @param {number} param0.id - ユーザーID
 * @param {string} param0.displayName - 表示名
 * @param {string} param0.bio - 自己紹介
 * @returns { data: UserType | null, error: PostgrestError | null } - 更新結果とエラー
 */
export async function updateUserProfileServerInServer({
  id,
  displayName,
  bio,
  x_url,
  facebook_url,
  instagram_url,
  github_url,
  portfolio_url,
}: {
  id: number;
  displayName: string;
  bio: string;
  x_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
}): Promise<PostgrestError | null> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("users")
    .update({
      display_name: displayName,
      bio,
      x_url,
      facebook_url,
      instagram_url,
      github_url,
      portfolio_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Supabase プロフィール更新エラー:", error.message);
    return error;
  }

  return null;
}
