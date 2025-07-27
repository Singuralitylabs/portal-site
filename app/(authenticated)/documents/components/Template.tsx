'use client';

import { DocumentCard } from './DocumentCard';
import { Grid, Paper } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';

import { DocumentWithCategoryType } from '@/app/types';
import { CategoryType, UserType } from '@/app/types';

interface DocumentsPageTemplateProps {
  documents: DocumentWithCategoryType[];
  categories: CategoryType[];
  currentUser?: UserType;
  //onEdit?: (document: DocumentWithCategoryType) => void;
  //onDelete?: (id: number) => Promise<{ success: boolean; error?: string | null }>; // 削除処理の結果を返す関数, Promise?は要確認
};

export function DocumentsPageTemplate({ documents, categories, currentUser, onEdit, onDelete }: DocumentsPageTemplateProps) {
  const documentCategoryNames = new Set(documents.map((document) => document.category?.name));
  const existingCategories = categories.filter((category) => documentCategoryNames.has(category.name));

  return (
    <Paper m="0 2rem">
      <PageTitle>資料一覧</PageTitle>
      <Paper>
        {existingCategories.map((category) => (
          <div key={category.id}>
            <h2>{category.name}</h2>
            <Grid>
              {documents.filter((document) => document.category?.name === category.name)
                .map((document) => (
                  <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={document.id + '_grid'}>
                    <DocumentCard
                      document={document}
                      currentUser={currentUser}
                    //onEdit={onEdit}
                    //onDelete={onDelete}
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
