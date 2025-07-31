import { fetchUserRoleByAuthId } from '@/app/services/api/user-server';
import { fetchDocuments } from '@/app/services/api/documents';
import { fetchCategoriesByType } from '@/app/services/api/categories';
import { DocumentsPageTemplate } from './components/Template';

export default async function DocumentsPage() {
  const { data, error } = await fetchDocuments();
  const { data: dataCategory, error: errorCategory } = await fetchCategoriesByType("documents");

  // サーバーサイドで利用ユーザーのroleを参照
  const { role, error: UserError } = await fetchUserRoleByAuthId();

  if (error || errorCategory || UserError) {
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
