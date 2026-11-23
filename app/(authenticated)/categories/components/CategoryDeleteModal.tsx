"use client";

import { Button, Group, Modal, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { CategoryImpactConfirmation } from "@/app/components/CategoryImpactConfirmation";
import type { CategoryImpact } from "@/app/utils/master-validation";
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
  const [impact, setImpact] = useState<CategoryImpact | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setImpact(null);
  }, [opened, category?.id]);

  const handleDelete = async (confirmationToken?: string) => {
    if (!category || loading) {
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

    setLoading(true);
    try {
      const result = await deleteCategory(
        category.id,
        category.category_type as CategoryTypeValue,
        confirmationToken
      );

      if (!result.success) {
        if (result.confirmation) {
          setImpact(result.confirmation);
          return;
        }
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
    } catch {
      notifications.show({
        title: "削除失敗",
        message: "通信に失敗しました。再試行してください。",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="削除の確認"
      centered
      size="lg"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
    >
      {impact ? (
        <CategoryImpactConfirmation
          impact={impact}
          loading={loading}
          onConfirm={() => void handleDelete(impact.token)}
          onCancel={() => setImpact(null)}
        />
      ) : (
        <>
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
            <Button
              color="red"
              onClick={() => void handleDelete()}
              disabled={isUnclassified}
              loading={loading}
            >
              削除
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
