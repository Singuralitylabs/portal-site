import { InsertUserType, UserStatusType, UserType } from "@/app/types";
import { createClientSupabaseClient } from "./supabase-client";
import { PostgrestError } from "@supabase/supabase-js";
import { UUID } from "crypto";

interface NewUserProps {
  authId: string;
  email: string;
  displayName: string;
}

/**
 * 新規ユーザーを users テーブルに追加する
 * @param {NewUserProps} props - ユーザー情報
 * @returns {Promise<{ data: InsertUserType[] | null, error: any }>} - 挿入結果とエラー
 */
export async function addNewUser({ authId, email, displayName }: NewUserProps) {
  const supabase = createClientSupabaseClient();

  const newUser: InsertUserType = {
    auth_id: authId,
    email: email,
    display_name: displayName,
    role: "member",
    status: "pending",
    is_deleted: false,
  };

  const { data, error } = await supabase.from("users").insert([newUser]).select();

  if (error) {
    console.error("Supabase 新規ユーザー追加エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * usersテーブルから指定のauth_idのユーザーのステータスを取得する（クライアントサイド用）
 * @param param0 - パラメータオブジェクト
 * @param {UUID | string} param0.authId - ユーザーの認証ID
 * @returns { status: UserStatusType | null, error: PostgrestError | null } - ユーザーステータスとエラー
 */
export async function fetchUserStatusById({
  authId,
}: {
  authId: UUID | string;
}): Promise<{ status: UserStatusType | null; error: PostgrestError | null }> {
  const supabase = createClientSupabaseClient();

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
 * usersテーブルから指定のauth_idのユーザーのステータスを取得する
 * @param param0 - ユーザーの認証ID
 * @param {string} authId - ユーザーの認証ID
 * @returns { status: UserStatusType | null, error: PostgrestError | null } - ユーザーステータスとエラー
 */
export async function fetchUserIdByAuthId({
  authId,
}: {
  authId: string;
}): Promise<{ userId: number | null; error: PostgrestError | null }> {
  const supabase = createClientSupabaseClient();

  const { data: user, error } = (await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .eq("is_deleted", false)
    .single()) as { data: UserType | null; error: PostgrestError | null };

  if (error || !user) {
    console.error("Supabase ユーザーID取得エラー:", error!.message || "ユーザーが見つかりません");
    return { userId: null, error };
  }

  return { userId: user.id, error: null };
}
