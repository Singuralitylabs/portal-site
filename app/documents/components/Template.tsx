'use client';

import { DocumentCard } from './DocumentCard';
import { Grid, Paper, Title } from '@mantine/core';

import { DocumentType } from '@/app/types';

interface DocumentsPageTemplateProps  {
    documents: DocumentType[];
};

export function DocumentsPageTemplate({documents} : DocumentsPageTemplateProps) {
  return (
    <Paper m="0 2rem">
      <Title order={1} p="1.25rem 0" style={{ borderBottom: '1px solid #888' }}>資料一覧</Title>

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