"use client";

import { useState } from "react";
import { DocumentCard } from "./DocumentCard";
import { Button } from "@mantine/core";
import { PageTitle } from "@/app/components/PageTitle";
import { DocumentFormModal } from "./DocumentFormModal";
import { DocumentWithCategoryType, CategoryType, DocumentUpdateFormType } from "@/app/types";
import { DocumentDeleteModal } from "./DocumentDeleteModal";
import CategoryLink from "@/app/(authenticated)/components/CategoryLink";

interface DocumentsPageTemplateProps {
  documents: DocumentWithCategoryType[];
  categories: CategoryType[];
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

  const [formModalOpened, setFormModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentUpdateFormType | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number>(0);

  const handleEditDocument = (document: DocumentUpdateFormType) => {
    setEditingDocument(document);
    setFormModalOpened(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpened(false);
    setEditingDocument(null);
  };

  const handleDeleteDocument = (documentId: number) => {
    setDeletingDocumentId(documentId);
    setDeleteModalOpened(true);
  };

  return (
    <div className="p-4 overflow-x-hidden">
      <PageTitle>資料一覧</PageTitle>
      {isContentMgr && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setFormModalOpened(true)} size="xs" variant="outline">
            新規登録
          </Button>
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
                      onEdit={handleEditDocument}
                      onDelete={handleDeleteDocument}
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

      <DocumentFormModal
        opened={formModalOpened}
        onClose={handleCloseFormModal}
        categories={categories}
        userId={userId}
        initialData={editingDocument || undefined}
      />

      <DocumentDeleteModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        userId={userId}
        documentId={deletingDocumentId}
      />
    </div>
  );
}
