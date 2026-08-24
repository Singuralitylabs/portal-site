import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { USER_STATUS } from "./app/constants/user";
import { fetchUserStatusByIdInServer } from "./app/services/api/users-server";
import {
  isApiPath,
  isPublicApiRoute,
  isPublicPageRoute,
  shouldSkipMiddleware,
} from "./app/utils/middleware-path";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルなどはスキップ
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  // 公開ページルートはそのまま通す
  if (isPublicPageRoute(pathname)) {
    return NextResponse.next();
  }

  // 公開が必要な API のみホワイトリストでスキップする
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ユーザー確認
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // API は呼び出し側の response.json() を壊さないよう 401 JSON を返す
    if (isApiPath(pathname)) {
      return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
    }
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // API のステータス判定は各ルートに委譲する（pending ユーザーの Slack 通知を通すため）
  if (isApiPath(pathname)) {
    return response;
  }

  // 認証済みユーザーとして自分のユーザー情報を確認
  const { status: userStatus, error: userError } = await fetchUserStatusByIdInServer({
    authId: user.id,
  });

  if (userError) {
    console.error("User data fetch error:", userError);
  }

  // ユーザーステータスに応じてリダイレクト
  if (!userStatus) {
    // ユーザー情報がない場合は承認待ちページへ
    const redirectUrl = new URL("/pending", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (userStatus === USER_STATUS.PENDING && !pathname.startsWith("/pending")) {
    const redirectUrl = new URL("/pending", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (userStatus === USER_STATUS.REJECTED && !pathname.startsWith("/rejected")) {
    const redirectUrl = new URL("/rejected", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // activeユーザーは通常ページにアクセス可能
  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
