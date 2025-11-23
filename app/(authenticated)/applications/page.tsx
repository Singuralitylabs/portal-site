import { fetchApplications } from "@/app/services/api/applications-server";
import { fetchCategoriesByType } from "@/app/services/api/categories-server";
import { ApplicationsPageTemplate } from "./components/Template";
import { checkContentPermissions } from "@/app/services/auth/permissions";
import { fetchUserInfoByAuthId, fetchActiveUsers } from "@/app/services/api/users-server";
import { getServerCurrentUser } from "@/app/services/api/supabase-server";

export default async function ApplicationsPage() {
  // サーバーサイドで利用ユーザー情報を参照
  const { authId, error: currentUserError } = await getServerCurrentUser();
  if (currentUserError) {
    console.error("認証情報の取得に失敗:", currentUserError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">認証情報を取得できませんでした。</p>
      </div>
    );
  }

  // アプリデータ・カテゴリーデータ・ユーザーデータ・開発者データを並列取得
  const [applicationsResult, categoriesResult, userResult, developersResult] = await Promise.all([
    fetchApplications(),
    fetchCategoriesByType("applications"),
    fetchUserInfoByAuthId({ authId: authId }),
    fetchActiveUsers(),
  ]);

  const { data: applications, error: applicationError } = applicationsResult;
  if (applicationError || !applications) {
    console.error("アプリデータの取得に失敗:", applicationError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">アプリデータを取得できませんでした。</p>
      </div>
    );
  }

  const { data: categories, error: categoryError } = categoriesResult;
  if (categoryError || !categories) {
    console.error("カテゴリーデータの取得に失敗:", categoryError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">カテゴリーデータを取得できませんでした。</p>
      </div>
    );
  }

  const { id: userId, role, error: roleError } = userResult;
  if (roleError || !role || !userId) {
    console.error("ユーザー情報の取得に失敗:", roleError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">ユーザー情報を取得できませんでした。</p>
      </div>
    );
  }

  const { data: developers, error: developersError } = developersResult;
  if (developersError || !developers) {
    console.error("開発者データの取得に失敗:", developersError);
  }

  return (
    <ApplicationsPageTemplate
      applications={applications}
      categories={categories}
      developers={developers || []}
      isContentMgr={checkContentPermissions(role)}
      userId={userId}
    />
  );
}
