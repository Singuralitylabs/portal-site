import supabase from "./supabase";

interface NewUserProps {
  clerkId: string;
  email: string;
  displayName: string;
}

export async function addNewUser({ clerkId, email, displayName }: NewUserProps) {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        clerk_id: clerkId,
        email: email,
        display_name: displayName,
        role: "member",
        status: "pending",
      },
    ])
    .select();

  if (error) {
    console.error("Supabase 新規ユーザー追加エラー:", error.message);
    return { data: null, error };
  }

  return { data, error: null };
}
