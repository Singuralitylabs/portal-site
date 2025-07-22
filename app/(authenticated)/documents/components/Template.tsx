'use client';

import { useState } from 'react';
import { DocumentCard } from './DocumentCard';
import { DocumentForm } from './DocumentForm';
import { Grid, Paper, Button, Flex, Modal } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';

import { DocumentWithCategoryType } from '@/app/types';
import { CategoryType } from '@/app/types';

interface DocumentsPageTemplateProps {
  documents: DocumentWithCategoryType[];
  categories: CategoryType[];
}

export function DocumentsPageTemplate({ documents, categories }: DocumentsPageTemplateProps) {
  const [opened, setOpened] = useState(false);

  const documentCategories = categories.filter((category) => category.category_type === 'document');
  const documentCategoryNames = new Set(
    documents
      .map((document) => document.category?.name)
      .filter((name) => documentCategories.some((cat) => cat.name === name))
  );
  const existingCategories = documentCategories.filter((category) => documentCategoryNames.has(category.name));
  const handleOpenModal = () => setOpened(true);

  return (
    <Paper m="0 2rem">
      <Flex justify="space-between" align="center" mb="md">
        <PageTitle>資料一覧</PageTitle>
        <Button onClick={handleOpenModal}>
          新規作成
        </Button>
      </Flex>
      <Modal opened={opened} onClose={() => setOpened(false)}>
        <DocumentForm
          categories={categories} // カテゴリー情報
          onSuccess={() => setOpened(false)}
          onClose={() => setOpened(false)}
        />
      </Modal>
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
            <br />
          </div>
        ))}
      </Paper>
    </Paper>
  );
}
