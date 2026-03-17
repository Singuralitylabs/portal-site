import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import { fetchUserInfoByAuthId } from "@/app/services/api/users-server";
import { checkContentPermissions } from "@/app/services/auth/permissions";
import { fetchCategoriesForManagement } from "@/app/services/api/categories-server";
import { CategoriesPageTemplate } from "./components/Template";

export default async function CategoriesPage() {
  const { authId, error: currentUserError } = await getServerCurrentUser();
  if (currentUserError) {
    console.error("認証情報の取得に失敗:", currentUserError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">認証情報を取得できませんでした。</p>
      </div>
    );
  }

  const { role, error: roleError } = await fetchUserInfoByAuthId({ authId });
  if (roleError || !role) {
    console.error("ユーザー情報の取得に失敗:", roleError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">ユーザー情報を取得できませんでした。</p>
      </div>
    );
  }

  if (!checkContentPermissions(role)) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">カテゴリー管理権限がありません。</p>
      </div>
    );
  }

  const [documentCategories, videoCategories, applicationCategories] = await Promise.all([
    fetchCategoriesForManagement("documents"),
    fetchCategoriesForManagement("videos"),
    fetchCategoriesForManagement("applications"),
  ]);

  if (documentCategories.error || videoCategories.error || applicationCategories.error) {
    console.error("カテゴリーデータの取得に失敗:", {
      documents: documentCategories.error,
      videos: videoCategories.error,
      applications: applicationCategories.error,
    });

    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">カテゴリーデータを取得できませんでした。</p>
      </div>
    );
  }

  return (
    <CategoriesPageTemplate
      initialCategories={{
        documents: documentCategories.data ?? [],
        videos: videoCategories.data ?? [],
        applications: applicationCategories.data ?? [],
      }}
    />
  );
}
