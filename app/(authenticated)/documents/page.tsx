import { fetchDocuments } from '@/app/services/api/documents';
import { fetchCategoriesByType } from '@/app/services/api/categories';
import { DocumentsPageTemplate } from './components/Template';

export default async function DocumentsPage() {
  const { data, error } = await fetchDocuments();
  const { data:dataCategory, error:errorCategory } = await fetchCategoriesByType("documents");

  if (error || errorCategory) {
    return <p>データを取得できませんでした。</p>;
  }

  return <DocumentsPageTemplate documents={data} categories={dataCategory} />;
}