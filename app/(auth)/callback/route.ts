import { CookieOptions, createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchUserStatusByIdInServer } from "@/app/services/api/user-server";
import { USER_STATUS } from "@/app/constants/user";

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
      const { status: userStatus, error: userError } = await fetchUserStatusByIdInServer({
        authId: data.session.user.id,
      });

      if (userError) {
        console.error("ユーザーステータス取得エラー:", userError);
        // 新規ユーザーの場合は承認待ちページへ（supabase-auth-providerでユーザー作成処理）
        return NextResponse.redirect(`${origin}/pending`);
      }

      console.log("ユーザーステータス:", userStatus);

      // ユーザーのステータスに応じてリダイレクト
      if (userStatus === USER_STATUS.ACTIVE) {
        return NextResponse.redirect(`${origin}/`);
      } else if (userStatus === USER_STATUS.REJECTED) {
        return NextResponse.redirect(`${origin}/rejected`);
      } else if (userStatus === USER_STATUS.PENDING) {
        return NextResponse.redirect(`${origin}/pending`);
      } else {
        console.error("不明なユーザーステータス:", userStatus);
        return NextResponse.redirect(`${origin}/login`);
      }
    } else {
      console.error("認証エラー:", error);
    }
  }

  // エラーが発生した場合はログインページにリダイレクト
  console.log("認証コードなしまたはエラー");
  return NextResponse.redirect(`${origin}/login`);
}
