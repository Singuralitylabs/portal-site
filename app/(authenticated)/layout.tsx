import { SideNav } from "./components/SideNav";
import { AuthLayout as AuthGuard } from "./auth-layout";
import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import { fetchUserInfoByAuthId } from "@/app/services/api/users-server";
import { checkAdminPermissions } from "@/app/services/auth/permissions";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let isAdmin = false;

  try {
    const { authId, error: currentUserError } = await getServerCurrentUser();
    if (!currentUserError && authId) {
      const { role, error: roleError } = await fetchUserInfoByAuthId({ authId });
      if (!roleError && role) {
        isAdmin = checkAdminPermissions(role);
      }
    }
  } catch (error: unknown) {
    // Dynamic server usageエラーは正常な動作（認証が必要なため静的生成できない）
    // その他のエラーの場合のみログ出力
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      error.digest !== "DYNAMIC_SERVER_USAGE"
    ) {
      console.error("レイアウトでのユーザー情報取得エラー:", error);
    }
  }

  return (
    <AuthGuard>
      <div className="sm:flex min-h-screen">
        <SideNav isAdmin={isAdmin} />
        <div className="flex-1 sm:ml-64 p-4">{children}</div>
      </div>
    </AuthGuard>
  );
}
