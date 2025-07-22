import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { USER_STATUS } from "./app/constants/user";

const publicRoutes = ["/login", "/callback", "/pending", "/rejected"];

function shouldSkipMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルなどはスキップ
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  // 公開ルートはそのまま通す
  if (publicRoutes.some(route => pathname.startsWith(route))) {
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

  // 未認証の場合はログインページにリダイレクト
  if (error || !user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 認証済みユーザーとして自分のユーザー情報を確認
  const { data: userData } = await supabase
    .from("users")
    .select("status")
    .eq("auth_id", user.id)
    .single();

  // ユーザーステータスに応じてリダイレクト
  if (!userData) {
    // ユーザー情報がない場合は承認待ちページへ
    const redirectUrl = new URL("/pending", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (userData.status === USER_STATUS.PENDING && !pathname.startsWith("/pending")) {
    const redirectUrl = new URL("/pending", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (userData.status === USER_STATUS.REJECTED && !pathname.startsWith("/rejected")) {
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
