'use client';

import { useState } from 'react';
import { DocumentCard } from './DocumentCard';
import { Grid, Paper, Button, Group } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';
import { DocumentFormModal } from './DocumentFormModal';
import { DocumentWithCategoryType, CategoryType } from '@/app/types';

interface DocumentsPageTemplateProps {
  documents: DocumentWithCategoryType[];
  categories: CategoryType[];
  currentUserRole: string;
  userId: number;
};

export function DocumentsPageTemplate({ documents, categories, currentUserRole, userId }: DocumentsPageTemplateProps) {
  const documentCategoryNames = new Set(documents.map((document) => document.category?.name));
  const existingCategories = categories.filter((category) => documentCategoryNames.has(category.name));

  // モーダル用の状態
  const [modalOpened, setModalOpened] = useState(false);
  const isAdmin = currentUserRole === 'admin';

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
      />

      <Paper mb="md" p="md">
        <div className="flex flex-wrap items-center">
          {existingCategories.map((category, index) => (
            <div key={category.id}>
              {index > 0 && <span className="text-gray-500 mx-2">|</span>}
              <a href={`#category-${category.id}`} className="text-blue-600">{category.name}</a>
            </div>
          ))}
        </div>
      </Paper>

      <Paper>
        {existingCategories.map((category) => (
          <div key={category.id}>
            <h2 id={`category-${category.id}`}>{category.name}</h2>
            <Grid>
              {documents.filter((document) => document.category?.name === category.name)
                .map((document) => (
                  <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={document.id + '_grid'}>
                    <DocumentCard
                      document={document}
                      currentUserRole={currentUserRole}
                      categories={categories}
                      userId={userId}
                    />
                  </Grid.Col>
                ))}
            </Grid>
            <br />
          </div>
        ))}
      </Paper>
    </Paper>
  );
}
