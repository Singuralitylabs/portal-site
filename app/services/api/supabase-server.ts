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
 * サーバーサイドで現在アクセスしている認証ユーザー情報（auth_id含む）を取得する
 * @returns 認証ユーザー情報（auth_idなど）またはnull
 */
export async function getServerCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }
  // 必要な情報だけ返す（auth_idなど）
  return {
    auth_id: data.user.id,
    email: data.user.email,
    // 必要に応じて他のauth情報も追加可能
  };
}
