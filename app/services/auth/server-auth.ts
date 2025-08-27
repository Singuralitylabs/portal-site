import { createServerSupabaseClient } from "@/app/services/api/supabase-server";
import { User } from "@supabase/supabase-js";

export interface ServerAuthResult {
  user: User | null;
  userStatus: "pending" | "active" | "rejected" | null;
  error?: string;
}

// サーバーサイドで認証とユーザーステータスを確認
export async function getServerAuth(): Promise<ServerAuthResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // ユーザー認証確認（セキュア）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, userStatus: null };
    }

    // ユーザーステータス確認
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("status")
      .eq("auth_id", user.id)
      .eq("is_deleted", false)
      .single();

    if (userError || !userData) {
      return {
        user,
        userStatus: null,
        error: "ユーザー情報が見つかりません",
      };
    }

    return {
      user,
      userStatus: userData.status as "pending" | "active" | "rejected",
    };
  } catch (error) {
    console.error("サーバー認証エラー:", error);
    return {
      user: null,
      userStatus: null,
      error: "サーバー認証エラーが発生しました",
    };
  }
}

// ユーザーがコンテンツの管理対象か確認
export function canContentManager(role: string): boolean {
  return role === "admin" || role === "maintainer";
}
