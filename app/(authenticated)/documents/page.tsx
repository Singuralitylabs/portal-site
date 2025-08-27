import { getServerCurrentUser } from '@/app/services/api/supabase-server';
import { fetchUserInfoByAuthId } from '@/app/services/api/user-server';
import { fetchDocuments } from '@/app/services/api/documents-server';
import { fetchCategoriesByType } from '@/app/services/api/categories';
import { DocumentsPageTemplate } from './components/Template';
import { canContentManager } from "@/app/services/auth/server-auth";

export default async function DocumentsPage() {
  // サーバーサイドで利用ユーザー情報を参照
  const { authId, error: currentUserError } = await getServerCurrentUser();
  if (currentUserError) {
    console.error("認証情報の取得に失敗:", currentUserError);
    return <p>認証情報が取得できませんでした。</p>;
  }

  const { data, error } = await fetchDocuments();
  const { data: dataCategory, error: errorCategory } = await fetchCategoriesByType("documents");
  const { id, role, error: roleError } = await fetchUserInfoByAuthId({ authId: authId });
  const isContentMgr = canContentManager(role);

  if (error || errorCategory || roleError) {
    console.error("データ取得エラー:", error || errorCategory || roleError);
    return <p>データを取得できませんでした。</p>;
  }

  return (
    <DocumentsPageTemplate
      documents={data}
      categories={dataCategory}
      isContentMgr={isContentMgr}
      userId={id}
    />
  );
}
