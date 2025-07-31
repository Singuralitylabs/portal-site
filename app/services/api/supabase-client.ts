import { createBrowserClient } from "@supabase/ssr";

// クライアントサイド用Supabaseクライアント
export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * サーバーサイドで現在アクセスしている認証ユーザー情報（auth_id含む）を取得する
 * @returns 認証ユーザー情報（auth_idなど）またはnull
 */
export async function getCurrentUser() {
  const supabase = createClientSupabaseClient();
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
