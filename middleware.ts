import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { USER_STATUS } from "./app/constants/user";
import { fetchUserStatusByIdInServer } from "./app/services/api/users-server";
import { buildContentSecurityPolicy } from "./app/utils/csp";
import {
  isApiPath,
  isPublicApiRoute,
  isPublicPageRoute,
  shouldSkipMiddleware,
} from "./app/utils/middleware-path";

// レスポンスに CSP を設定する。nonce はここでしか使わないため、返却直前に一箇所で付与する。
function withCsp<T extends NextResponse>(response: T, nonce: string): T {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Server Component 側 (next/headers) から参照できるよう、リクエストヘッダーに nonce を積む。
  // 以降の NextResponse.next({ request: { headers: request.headers } }) はこの参照を共有する。
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  request.headers.set("x-nonce", nonce);

  // 静的ファイルなどはスキップ
  if (shouldSkipMiddleware(pathname)) {
    return withCsp(NextResponse.next({ request: { headers: request.headers } }), nonce);
  }

  // 公開ページルートはそのまま通す
  if (isPublicPageRoute(pathname)) {
    return withCsp(NextResponse.next({ request: { headers: request.headers } }), nonce);
  }

  // 公開が必要な API のみホワイトリストでスキップする
  if (isPublicApiRoute(pathname)) {
    return withCsp(NextResponse.next({ request: { headers: request.headers } }), nonce);
  }

  let response = withCsp(
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    }),
    nonce
  );

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
      return withCsp(
        NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 }),
        nonce
      );
    }
    const redirectUrl = new URL("/login", request.url);
    return withCsp(NextResponse.redirect(redirectUrl), nonce);
  }

  // 多層防御: middleware はセッション有無のみ確認する。
  // status 判定は各ルートの requireApiUser に委譲する（pending の Slack 通知を通すため）。
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
    return withCsp(NextResponse.redirect(redirectUrl), nonce);
  }

  if (userStatus === USER_STATUS.PENDING && !pathname.startsWith("/pending")) {
    const redirectUrl = new URL("/pending", request.url);
    return withCsp(NextResponse.redirect(redirectUrl), nonce);
  }

  if (userStatus === USER_STATUS.REJECTED && !pathname.startsWith("/rejected")) {
    const redirectUrl = new URL("/rejected", request.url);
    return withCsp(NextResponse.redirect(redirectUrl), nonce);
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
