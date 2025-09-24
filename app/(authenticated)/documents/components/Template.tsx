import { DocumentCard } from "./DocumentCard";
import { PageTitle } from "@/app/components/PageTitle";
import { DocumentWithCategoryType, SelectCategoryType } from "@/app/types";
import CategoryLink from "@/app/(authenticated)/components/CategoryLink";
import ContentMgrNewButton from "@/app/(authenticated)/components/ContentMgrNewButton";
import { CONTENT_TYPE } from "@/app/constants/content";

interface DocumentsPageTemplateProps {
  documents: DocumentWithCategoryType[];
  categories: SelectCategoryType[];
  isContentMgr: boolean;
  userId: number;
}

export function DocumentsPageTemplate({
  documents,
  categories,
  isContentMgr,
  userId,
}: DocumentsPageTemplateProps) {
  const documentCategoryNames = new Set(documents.map(document => document.category?.name));
  const existingCategories = categories.filter(category =>
    documentCategoryNames.has(category.name)
  );

  return (
    <>
      <PageTitle>資料一覧</PageTitle>
      {isContentMgr && (
        <div className="mt-4 flex justify-end">
          <ContentMgrNewButton type={CONTENT_TYPE.DOCUMENT} categories={categories} userId={userId}>
            新規登録
          </ContentMgrNewButton>
        </div>
      )}

      <div className="mb-4 py-4 flex flex-wrap items-center">
        <CategoryLink
          categories={existingCategories.map(category => ({
            id: category.id,
            name: category.name,
          }))}
        />
      </div>

      <div>
        {existingCategories.map(category => (
          <div key={category.id} className="mb-12">
            <h2 id={`category-${category.id}`}>{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {documents
                .filter(document => document.category?.name === category.name)
                .map(document => (
                  <div key={document.id} className="w-full">
                    <DocumentCard
                      document={document}
                      isContentMgr={isContentMgr}
                      categories={categories}
                      userId={userId}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-left mt-8 mb-4">
        <a href="#" className="text-blue-600">
          TOPへ
        </a>
      </div>
    </>
  );
}
