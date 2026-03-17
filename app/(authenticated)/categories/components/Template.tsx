"use client";

import { useMemo, useState } from "react";
import { ActionIcon, Button, Group, Menu, Paper, Tabs, Text } from "@mantine/core";
import { EllipsisVertical } from "lucide-react";
import { PageTitle } from "@/app/components/PageTitle";
import type { CategoryManagementItemType, CategoryTypeValue } from "@/app/types";
import { CategoryFormModal } from "./CategoryFormModal";
import { CategoryDeleteModal } from "./CategoryDeleteModal";

interface CategoriesPageTemplateProps {
  initialCategories: {
    documents: CategoryManagementItemType[];
    videos: CategoryManagementItemType[];
    applications: CategoryManagementItemType[];
  };
}

const CATEGORY_TYPE_LABELS: Record<CategoryTypeValue, string> = {
  documents: "資料",
  videos: "動画",
  applications: "アプリ",
};

const UNCLASSIFIED_CATEGORY_NAME = "未分類";

export function CategoriesPageTemplate({ initialCategories }: CategoriesPageTemplateProps) {
  const [activeType, setActiveType] = useState<CategoryTypeValue>("documents");
  const [editingCategory, setEditingCategory] = useState<CategoryManagementItemType | undefined>();
  const [deletingCategory, setDeletingCategory] = useState<CategoryManagementItemType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const categoriesByType = useMemo(
    () => ({
      documents: initialCategories.documents,
      videos: initialCategories.videos,
      applications: initialCategories.applications,
    }),
    [initialCategories]
  );

  const openCreateModal = () => {
    setEditingCategory(undefined);
    setIsFormOpen(true);
  };

  const openEditModal = (category: CategoryManagementItemType) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const openDeleteModal = (category: CategoryManagementItemType) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  return (
    <>
      <PageTitle>カテゴリー管理</PageTitle>

      <Group justify="space-between" mt="md" mb="md">
        <Tabs
          value={activeType}
          onChange={value => setActiveType((value as CategoryTypeValue) || "documents")}
        >
          <Tabs.List>
            <Tabs.Tab value="documents">資料</Tabs.Tab>
            <Tabs.Tab value="videos">動画</Tabs.Tab>
            <Tabs.Tab value="applications">アプリ</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Button onClick={openCreateModal}>新規登録</Button>
      </Group>

      <div className="space-y-3">
        {categoriesByType[activeType].length > 0 ? (
          categoriesByType[activeType].map(category => (
            <Paper
              key={category.id}
              withBorder
              p="md"
              className="flex items-center justify-between"
            >
              <div>
                <Text fw={600}>
                  {category.display_order}. {category.name}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {category.description || "説明は未設定です"}
                </Text>
              </div>

              <Menu>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray">
                    <EllipsisVertical size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => openEditModal(category)}>編集</Menu.Item>
                  {category.name !== UNCLASSIFIED_CATEGORY_NAME && (
                    <Menu.Item color="red" onClick={() => openDeleteModal(category)}>
                      削除
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Paper>
          ))
        ) : (
          <Text c="dimmed">
            {CATEGORY_TYPE_LABELS[activeType]}カテゴリーはまだ登録されていません。
          </Text>
        )}
      </div>

      <CategoryFormModal
        opened={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingCategory}
        defaultType={activeType}
      />

      <CategoryDeleteModal
        opened={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        category={deletingCategory}
      />
    </>
  );
}
