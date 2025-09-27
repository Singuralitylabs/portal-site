import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import { fetchUserInfoByAuthId } from "@/app/services/api/users-server";
import { fetchDocuments } from "@/app/services/api/documents-server";
import { fetchCategoriesByType } from "@/app/services/api/categories-server";
import { DocumentsPageTemplate } from "./components/Template";
import { checkContentPermissions } from "@/app/services/auth/permissions";

export default async function DocumentsPage() {
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

  // 資料データ・カテゴリーデータ・ユーザー情報を並列取得して権限を確認
  const [documentsResult, categoriesResult, userResult] = await Promise.all([
    fetchDocuments(),
    fetchCategoriesByType("documents"),
    fetchUserInfoByAuthId({ authId: authId }),
  ]);

  const { data: documents, error: documentError } = documentsResult;
  if (documentError || !documents) {
    console.error("資料データの取得に失敗:", documentError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">資料データを取得できませんでした。</p>
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

  return (
    <DocumentsPageTemplate
      documents={documents}
      categories={categories}
      isContentMgr={checkContentPermissions(role)}
      userId={userId}
    />
  );
}
