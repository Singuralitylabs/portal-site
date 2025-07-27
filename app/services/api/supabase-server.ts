import { CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * サーバーサイドで現在アクセスしているユーザー情報（usersテーブルの型）を取得する
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }

  // usersテーブルから追加情報を取得
  const { data: userProfile, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", data.user.id)
    .single();

  return { userProfile, userError };
}
