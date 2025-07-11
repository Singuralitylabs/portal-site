'use client';

import { DocumentCard } from './DocumentCard';
import { Grid, Paper } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';

import { DocumentWithCategoryType } from '@/app/types';
import { CategoryType } from '@/app/types';

interface DocumentsPageTemplateProps  {
    documents: DocumentWithCategoryType[];
    categories: CategoryType[];
};

export function DocumentsPageTemplate({ documents, categories } : DocumentsPageTemplateProps) {
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
                    <DocumentCard document={document} />
                  </Grid.Col>
              ))}
            </Grid>
            <br/>
          </div>
        ))}
      </Paper>
    </Paper>
  );
}
