import { getServerCurrentUser } from '@/app/services/api/supabase-server';
import { fetchUserRoleByAuthId } from '@/app/services/api/user-server';
import { fetchDocuments } from '@/app/services/api/documents';
import { fetchCategoriesByType } from '@/app/services/api/categories';
import { DocumentsPageTemplate } from './components/Template';

export default async function DocumentsPage() {
  const { data, error } = await fetchDocuments();
  const { data: dataCategory, error: errorCategory } = await fetchCategoriesByType("documents");

  // サーバーサイドで利用ユーザーのroleを参照
  const { auth_id, error: SupabaseError } = await getServerCurrentUser();
  if (!auth_id || SupabaseError) {
    console.error("認証情報の取得に失敗:", SupabaseError);
    return <p>認証情報が取得できませんでした。</p>;
  }
  const { role, error: UserError } = await fetchUserRoleByAuthId({ authId: auth_id });

  if (!role || error || errorCategory || UserError) {
    console.error("データ取得エラー:", error || errorCategory || UserError);
    return <p>データを取得できませんでした。</p>;
  }

  return (
    <DocumentsPageTemplate
      documents={data}
      categories={dataCategory}
      currentUserRole={role}
    />
  );
}
