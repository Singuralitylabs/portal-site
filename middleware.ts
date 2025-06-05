import { currentUser, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { fetchUserStatusByClerkId } from "@/app/services/api/user";

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

    const user = await currentUser();
    const userId: string = user?.id || "";

    // Clerk上にユーザーIDが存在しない場合はログインページへリダイレクト
    if (!userId) {
      return Response.redirect(new URL("/login", request.url));
    }

    // SupabaseのUsersテーブルからユーザー情報を取得
    const { data, error } = await fetchUserStatusByClerkId(Number(userId));

    if (error || !data) {
      // Usersテーブルにユーザーが見つからない場合はログインページへ
      return Response.redirect(new URL("/login", request.url));
    }

    if (data.status !== "pending") {
      return Response.redirect(new URL("/unapproved", request.url));
    }
    if (data.status === "reject") {
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
