import { InsertUserType } from "@/app/types";
import supabase from "./supabase";
import { createServerSupabaseClient } from "./supabase";

interface NewUserProps {
  clerkId: string;
  email: string;
  displayName: string;
}

export async function addNewUser({ clerkId, email, displayName }: NewUserProps) {
  const newUser: InsertUserType = {
    clerk_id: clerkId,
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
 * fetchUserStatusByClerkId
 * @param clerkId
 * @returns data: ユーザのステータス情報, error: エラー情報
 */
export async function fetchUserStatusByClerkId(clerkId: number) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("Users")
    .select("status")
    .eq("clerk_user_id", clerkId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    console.error("Supabase ユーザデータ取得エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
