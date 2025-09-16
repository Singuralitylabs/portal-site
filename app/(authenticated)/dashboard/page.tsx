import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import { fetchUserInfoByAuthId, fetchApprovalUsers } from "@/app/services/api/users-server";
import DashboardPageTemplate from "@/app/(authenticated)/dashboard/components/Template";
import { checkUserPermissions } from "@/app/services/auth/permissions";

export default async function DashboardPage() {
  const { authId, error: currentUserError } = await getServerCurrentUser();
  if (currentUserError) {
    console.error("認証情報の取得に失敗:", currentUserError);
    return <p>認証情報が取得できませんでした。</p>;
  }

  const { data, error } = await fetchApprovalUsers();
  if (error || !data) {
    console.error("会員一覧の取得に失敗:", error);
    return <p>会員一覧を取得できませんでした。</p>;
  }

  const { id, role, error: roleError } = await fetchUserInfoByAuthId({ authId });
  if (error || roleError) {
    console.error("データ取得エラー:", error || roleError);
    return <p>データを取得できませんでした。</p>;
  }

  if (!checkUserPermissions(role)) {
    console.error("管理者ではありません.");
    return <p>管理者ではありません</p>;
  }

  return <DashboardPageTemplate members={data} adminId={id} />;
}
