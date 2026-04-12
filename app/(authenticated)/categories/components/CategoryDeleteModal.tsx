"use client";

import { Button, Group, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { deleteCategory } from "@/app/services/api/categories-client";
import type { CategoryManagementItemType, CategoryTypeValue } from "@/app/types";

interface CategoryDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  category: CategoryManagementItemType | null;
}

const UNCLASSIFIED_CATEGORY_NAME = "未分類";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return "不明なエラー";
}

export function CategoryDeleteModal({ opened, onClose, category }: CategoryDeleteModalProps) {
  const router = useRouter();
  const isUnclassified = category?.name === UNCLASSIFIED_CATEGORY_NAME;

  const handleDelete = async () => {
    if (!category) {
      return;
    }

    if (isUnclassified) {
      notifications.show({
        title: "削除不可",
        message: "未分類カテゴリーは削除できません。",
        color: "yellow",
      });
      return;
    }

    const result = await deleteCategory(category.id, category.category_type as CategoryTypeValue);

    if (!result.success) {
      notifications.show({
        title: "削除失敗",
        message: getErrorMessage(result.error),
        color: "red",
      });
      return;
    }

    notifications.show({
      title: "削除完了",
      message: "カテゴリーを削除しました。",
      color: "green",
    });

    onClose();
    router.refresh();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="削除の確認" centered>
      <Text mb="xs">カテゴリー「{category?.name ?? ""}」を削除しますか？</Text>
      <Text size="sm" c="dimmed" mb="md">
        {isUnclassified
          ? "未分類カテゴリーはシステム予約のため削除できません。"
          : "紐づくコンテンツは同種別の「未分類」カテゴリーへ移動されます。"}
      </Text>

      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          キャンセル
        </Button>
        <Button color="red" onClick={handleDelete} disabled={isUnclassified}>
          削除
        </Button>
      </Group>
    </Modal>
  );
}
