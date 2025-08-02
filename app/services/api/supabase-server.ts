import { CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AuthError } from "@supabase/supabase-js";

// サーバーサイド用Supabaseクライアント（認証付き）
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // サーバーコンポーネントで呼び出された場合のエラーハンドリング
          }
        },
      },
    }
  );
}

/**
 * サーバーサイドで現在アクセスしている認証ユーザー情報（authId含む）を取得する
 * @returns 認証ユーザー情報（authIdなど）
 */
export async function getServerCurrentUser(): Promise<{
  authId: string;
  error: AuthError | null;
}> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data || !data.user) {
    console.error("認証ユーザー情報取得エラー:", error?.message || "No data found");
    return { authId: "", error };
  }

  return { authId: data.user.id, error: null };
}
