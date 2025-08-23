"use client";

import { useState } from "react";
import { DocumentCard } from "./DocumentCard";
import { Grid, Paper, Button, Group } from "@mantine/core";
import { PageTitle } from "@/app/components/PageTitle";
import { DocumentFormModal } from "./DocumentFormModal";
import { DocumentWithCategoryType, CategoryType, DocumentUpdateFormType } from "@/app/types";
import { DocumentDeleteModal } from "./DocumentDeleteModal";
import { isContentManager } from "@/app/utils/permissions";

interface DocumentsPageTemplateProps {
  documents: DocumentWithCategoryType[];
  categories: CategoryType[];
  currentUserRole: string;
  userId: number;
}

export function DocumentsPageTemplate({
  documents,
  categories,
  currentUserRole,
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
  const isContentMgr = isContentManager(currentUserRole);

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
    <Paper m="0 2rem">
      <Group justify="space-between" align="center" mb="md">
        <PageTitle>資料一覧</PageTitle>
        {isContentMgr && (
          <Button onClick={() => setFormModalOpened(true)} color="blue">
            新規登録
          </Button>
        )}
      </Group>

      <Paper mb="md" p="md">
        <div className="flex flex-wrap items-center">
          {existingCategories.map(category => (
            <div key={category.id}>
              <a href={`#category-${category.id}`} className="text-blue-600 mr-4">
                {category.name}
              </a>
            </div>
          ))}
        </div>
      </Paper>

      <Paper>
        {existingCategories.map(category => (
          <div key={category.id}>
            <h2 id={`category-${category.id}`}>{category.name}</h2>
            <Grid>
              {documents
                .filter(document => document.category?.name === category.name)
                .map(document => (
                  <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={document.id + "_grid"}>
                    <DocumentCard
                      document={document}
                      isAdmin={isContentMgr}
                      onEdit={handleEditDocument}
                      onDelete={handleDeleteDocument}
                    />
                  </Grid.Col>
                ))}
            </Grid>
          </div>
        ))}
      </Paper>

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
    </Paper>
  );
}
