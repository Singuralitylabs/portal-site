import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import { fetchUserInfoByAuthId, fetchApprovalUsers } from "@/app/services/api/users-server";
import DashboardPageTemplate from "@/app/(authenticated)/dashboard/components/Template";
import { checkAdminPermissions } from "@/app/services/auth/permissions";

export default async function DashboardPage() {
    const { authId, error: currentUserError } = await getServerCurrentUser();
    if (currentUserError) {
        console.error("認証情報の取得に失敗:", currentUserError);
        return <p>認証情報が取得できませんでした。</p>;
    }

    const { error, data: initialData } = await fetchApprovalUsers();
    const data = initialData ?? [];

    if (error) {
        console.error("承認待ちの会員一覧取得に失敗:", error);
        return <p>承認待ちの会員一覧を取得できませんでした。</p>;
    }

    const { role, error: roleError } = await fetchUserInfoByAuthId({ authId });
    if (roleError) {
        console.error("データ取得エラー:", roleError);
        return <p>データを取得できませんでした。</p>;
    }

    if (!checkAdminPermissions(role)) {
        console.error("管理者ではありません.");
        return <p>管理者ではありません</p>;
    }

    return <DashboardPageTemplate members={data} />;
}
