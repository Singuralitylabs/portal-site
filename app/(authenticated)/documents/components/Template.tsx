'use client';

import { useState } from 'react';
import { DocumentCard } from './DocumentCard';
import { Grid, Paper, Button, Group } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';
import { FormType, DocumentFormModal } from './DocumentFormModal';
import { notifications } from '@mantine/notifications';

import { DocumentWithCategoryType } from '@/app/types';
import { CategoryType } from '@/app/types';
import { createDocumentOnServer } from '@/app/services/api/documents-client';

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
  const [form, setForm] = useState<FormType>({
    name: '',
    categoryId: 0,
    description: '',
    url: '',
    assignee: '',
  });

  // 新規登録用のフォーム処理
  async function handleCreate(form: FormType): Promise<boolean> {
    const { data, error } = await createDocumentOnServer({
      name: form.name,
      categoryId: Number(form.categoryId),
      description: form.description,
      url: form.url,
      assignee: form.assignee,
      userId: userId
    });

    if (error) {
      console.error("ドキュメントの作成に失敗:", error.message);
      notifications.show({
        title: '登録エラー',
        message: `ドキュメントの作成に失敗: ${error.message}`,
        color: 'red',
      });
      return false;
    }

    setModalOpened(false);

    // 正常時のポップアップ
    notifications.show({
      title: '登録完了',
      message: `"${data?.name}" が正常に登録されました`,
      color: 'green',
    });

    return true;
  }

  return (
    <Paper m="0 2rem">
      <Group justify="space-between" align="center" mb="md">
        <PageTitle>資料一覧</PageTitle>
        {currentUserRole === 'admin' && (
          <Button onClick={() => setModalOpened(true)} color="blue">
            新規登録
          </Button>
        )}
      </Group>

      <DocumentFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        categories={categories}
        onSubmit={handleCreate}
        form={form}
        setForm={setForm}
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
