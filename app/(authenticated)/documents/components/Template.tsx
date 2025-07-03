'use client';

import { DocumentCard } from './DocumentCard';
import { Grid, Paper } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';

import { DocumentWithCategoryType } from '@/app/types';

interface DocumentsPageTemplateProps  {
    documents: DocumentWithCategoryType[];
};

export function DocumentsPageTemplate({documents} : DocumentsPageTemplateProps) {
  return (
    <Paper m="0 2rem">
      <PageTitle>資料一覧</PageTitle>

      <Paper>
        <Grid>
          {documents.map((document) => (
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={document.id + '_grid'}>
              <DocumentCard document={document} />
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Paper>
  );
}
