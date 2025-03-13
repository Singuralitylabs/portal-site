import { fetchDocuments } from '@/app/services/api/documents';
import { DocumentsPageTemplate } from './components/Template ';

export default async function DocumentsPage() {
  const { data, error } = await fetchDocuments();

  if (error) {
    console.error('データ取得エラー:', error);
    return <p>データを取得できませんでした。</p>;
  }

  return <DocumentsPageTemplate documents={data} />;
}