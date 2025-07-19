import { CookieOptions, createServerClient } from "@supabase/ssr";
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
      console.log("認証成功:", data.session.user.email);

      // 認証済みユーザーとして自分のユーザー情報を確認
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("status")
        .eq("auth_id", data.session.user.id)
        .single();

      if (userError) {
        console.error("ユーザー情報取得エラー:", userError);

        // 新規ユーザーの場合、usersテーブルにレコードを作成
        if (userError.code === "PGRST116") {
          console.log("新規ユーザーを作成中:", data.session.user.email);

          const { error: insertError } = await supabase.from("users").insert({
            auth_id: data.session.user.id,
            email: data.session.user.email || "",
            name: data.session.user.user_metadata?.name || data.session.user.email || "",
            status: "pending",
          });

          if (insertError) {
            console.error("ユーザー作成エラー:", insertError);
          } else {
            console.log("新規ユーザー作成完了");
          }
        }

        // ユーザー情報がない場合は承認待ちページへ
        return NextResponse.redirect(`${origin}/pending`);
      }

      console.log("ユーザーステータス:", userData.status);

      // ユーザーのステータスに応じてリダイレクト
      if (userData.status === "active") {
        return NextResponse.redirect(`${origin}/`);
      } else if (userData.status === "rejected") {
        return NextResponse.redirect(`${origin}/rejected`);
      } else {
        // pending の場合
        return NextResponse.redirect(`${origin}/pending`);
      }
    } else {
      console.error("認証エラー:", error);
    }
  }

  // エラーが発生した場合はログインページにリダイレクト
  console.log("認証コードなしまたはエラー");
  return NextResponse.redirect(`${origin}/login`);
}
