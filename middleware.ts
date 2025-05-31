import { currentUser, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/sso-callback",
  "/services/api/webhooks(.*)",
  "/unapproved",
  "/rejected",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // Protect all routes except public ones
    await auth.protect();

    const current_user = await currentUser();
    const userId = current_user?.id || "";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );

    // Clerk上にユーザーIDが存在しない場合はログインページへリダイレクト
    if (!userId) {
      return Response.redirect(new URL("/login", request.url));
    }

    // SupabaseのUsersテーブルからユーザー情報を取得
    const { data: user, error } = await supabase
      .from("Users")
      .select("status")
      .eq("clerk_user_id", userId) // ClerkのユーザーIDで検索
      .single();

    if (error || !user) {
      // Usersテーブルにユーザーが見つからない場合はログインページへ
      return Response.redirect(new URL("/login", request.url));
    }

    if (user.status !== "pending") {
      return Response.redirect(new URL("/unapproved", request.url));
    }
    if (user.status === "reject") {
      return Response.redirect(new URL("/rejected", request.url));
    }
    // statusがactiveならそのまま
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
