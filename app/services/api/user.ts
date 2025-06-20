import { InsertUserType, UserType } from "@/app/types";
import supabase from "./supabase";

interface NewUserProps {
  clerkId: string;
  email: string;
  displayName: string;
}

interface UpdateProfileProps {
  id: number;
  displayName: string;
  bio: string;
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

export async function updateUserProfile({ id, displayName, bio }: UpdateProfileProps) {
  const { data, error } = await supabase
    .from("users")
    .update({
      display_name: displayName,
      bio: bio,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Supabase プロフィール更新エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function getUserByClerkId(clerkId: string) {
  // .single()の代わりに、最初の結果を取得
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .eq("is_deleted", false)
    .limit(1);

  if (error) {
    console.error("Supabase ユーザー取得エラー:", error.message);
    return { data: null, error };
  }

  // データが存在しない場合
  if (!data || data.length === 0) {
    return { data: null, error: { message: "ユーザーが見つかりません" } };
  }

  return { data: data[0] as UserType, error: null };
}
