import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // middlewareで適切なページにリダイレクトされるため、一律でホームページへ
      return NextResponse.redirect(`${origin}/`);
    } else {
      console.error("認証エラー:", error ?? "セッションを確立できませんでした");
    }
  } else {
    console.error("認証エラー: codeパラメータが存在しません");
  }

  // エラーが発生した場合はログインページにリダイレクト
  return NextResponse.redirect(`${origin}/login`);
}
