import { InsertUserType } from "@/app/types";
import { createClientSupabaseClient } from "./supabase";

interface NewUserProps {
  authId: string;
  email: string;
  displayName: string;
}

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
