import { getCurrentUser } from '@/app/services/api/supabase-server';
import { fetchDocuments } from '@/app/services/api/documents';
import { fetchCategoriesByType } from '@/app/services/api/categories';
import { DocumentsPageTemplate } from './components/Template';

export default async function DocumentsPage() {
  const { data, error } = await fetchDocuments();
  const { data: dataCategory, error: errorCategory } = await fetchCategoriesByType("documents");

  // サーバーサイドでcurrentUserを取得
  const currentUser = await getCurrentUser();

  if (error || errorCategory || currentUser?.userError) {
    return <p>データを取得できませんでした。</p>;
  }

  return (
    <DocumentsPageTemplate
      documents={data}
      categories={dataCategory}
      currentUser={currentUser?.userProfile}
    />
  );
}
