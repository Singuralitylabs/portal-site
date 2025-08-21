"use client";

import { useState } from "react";
import { DocumentCard } from "./DocumentCard";
import { Grid, Paper, Button, Group } from "@mantine/core";
import { PageTitle } from "@/app/components/PageTitle";
import { DocumentFormModal } from "./DocumentFormModal";
import { DocumentWithCategoryType, CategoryType, DocumentUpdateFormType } from "@/app/types";

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

  const [modalOpened, setModalOpened] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentUpdateFormType | null>(null);
  const isAdmin = currentUserRole === "admin";

  const handleEditDocument = (document: DocumentUpdateFormType) => {
    setEditingDocument(document);
    setModalOpened(true);
  };

  return (
    <Paper m="0 2rem">
      <Group justify="space-between" align="center" mb="md">
        <PageTitle>資料一覧</PageTitle>
        {isAdmin && (
          <Button onClick={() => setModalOpened(true)} color="blue">
            新規登録
          </Button>
        )}
      </Group>

      <DocumentFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        categories={categories}
        userId={userId}
        initialData={editingDocument || undefined}
      />

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
                      isAdmin={isAdmin}
                      userId={userId}
                      onEdit={handleEditDocument}
                    />
                  </Grid.Col>
                ))}
            </Grid>
          </div>
        ))}
      </Paper>

      <div className="text-left mt-8 mb-4 ml-6">
        <a href="#" className="text-blue-600">
          TOPへ
        </a>
      </div>
    </Paper>
  );
}
