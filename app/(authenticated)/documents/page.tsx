import { fetchDocuments } from "@/app/services/api/documents";
import { DocumentsPageTemplate } from "@/app/(authenticated)/documents/components/Template";

export default async function DocumentsPage() {
  const { data, error } = await fetchDocuments();

  if (error) {
    return <p>データを取得できませんでした。</p>;
  }

  return <DocumentsPageTemplate documents={data} />;
}
