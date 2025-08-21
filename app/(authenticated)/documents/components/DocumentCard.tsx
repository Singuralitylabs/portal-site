'use client';

import { useState } from 'react';
import { DocumentWithCategoryType, CategoryType } from '@/app/types';
import { FileText, FileType, Calendar } from 'lucide-react';
import { Button, Card, Flex, Text, Modal, Group } from '@mantine/core';
import { deleteDocument } from '@/app/services/api/documents-client';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { DocumentFormModal } from './DocumentFormModal';

interface DocumentCardProps {
  document: DocumentWithCategoryType;
  isAdmin: boolean;
  categories: CategoryType[];
  userId: number;
}

export function DocumentCard({ document, isAdmin, categories, userId }: DocumentCardProps) {
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);  // 削除モーダル用
  const [editModalOpened, setEditModalOpened] = useState(false);  // 編集モーダル用
  const router = useRouter();
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText style={{ width: '1.25rem', height: '1.25rem' }} />;
      default:
        return <FileType style={{ width: '1.25rem', height: '1.25rem' }} />;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const result = await deleteDocument(id, userId);
      setDeleteModalOpened(false);
      if (result?.success) {
        notifications.show({
          title: '削除完了',
          message: '資料を削除しました。',
          color: 'green',
        });
        router.refresh();
      } else {
        notifications.show({
          title: '削除失敗',
          message: String(result?.error) || '不明なエラー',
          color: 'red',
        });
      }
    } catch (e) {
      setDeleteModalOpened(false);
      notifications.show({
        title: 'エラー',
        message: '削除処理で予期しないエラーが発生しました',
        color: 'red',
      });
      console.error(e);
    }
  };

  return (
    <Card component="div" shadow="sm" padding="lg" radius="md" w="100%" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Flex gap="0.25rem" justify="flex-start" align="flex-start" direction="row">
          <div>{getFileTypeIcon('pdf')}</div>
          <div>{document.name}</div>
        </Flex>
      </Card.Section>
      <Card.Section>
        <Text component="div" p="1rem">{document.description}</Text>
        <Flex gap="0.25rem" justify="flex-start" align="center" direction="row" p="0 1rem 1rem">
          <Calendar style={{ width: '1rem', height: '1rem' }} />
          <Text component="div" fs="0.875rem" lh="1.25rem">{new Date(document.updated_at).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll('/', '-')}</Text>
          <Button component="div" radius="md" size="compact-sm" c="rgb(23,23,23)" bg="gray.2" fs="0.875rem" lh="1.25rem" ml="0.5rem">
            {document.category?.name}
          </Button>
        </Flex>
        <Button color="#000" component="a" href={document.url} w={'100% - 2rem'} m="0 1rem 1rem" display="block" target="_blank" rel="noopener noreferrer">
          資料を開く
        </Button>
        {isAdmin && (
          <Group m="0 1rem 1rem" gap="xs">
            <Button color="blue" onClick={() => setEditModalOpened(true)}>
              編集
            </Button>
            <Button color="red" onClick={() => setDeleteModalOpened(true)}>
              削除
            </Button>
          </Group>
        )}
      </Card.Section>
      {/* 編集モーダル */}
      <DocumentFormModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
        }}
        categories={categories}
        userId={userId}
        initialData={document}
      />
      {/* 削除モーダル */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="削除の確認"
        centered
      >
        <Text mb="md">本当にこの資料を削除しますか？</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpened(false)}>
            キャンセル
          </Button>
          <Button color="red" onClick={() => handleDelete(document.id)}>
            削除
          </Button>
        </Group>
      </Modal>
    </Card>
  );
}