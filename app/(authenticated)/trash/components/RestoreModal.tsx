"use client";

import { Button, Group, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import type { TrashTabType, TrashContentItem, TrashCategoryItem } from "@/app/types";
import {
  restoreDocument,
  restoreVideo,
  restoreApplication,
  restoreCategory,
} from "@/app/services/api/trash-client";

interface RestoreModalProps {
  opened: boolean;
  onClose: () => void;
  target: {
    type: TrashTabType;
    item: TrashContentItem | TrashCategoryItem;
  } | null;
  userId: number;
}

const TAB_LABELS: Record<TrashTabType, string> = {
  documents: "資料",
  videos: "動画",
  applications: "アプリ",
  categories: "カテゴリー",
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return "不明なエラー";
}

export function RestoreModal({ opened, onClose, target, userId }: RestoreModalProps) {
  const router = useRouter();

  const handleRestore = async () => {
    if (!target) return;

    let result: { success: boolean; error: Error | null };

    switch (target.type) {
      case "documents":
        result = await restoreDocument(target.item.id, userId);
        break;
      case "videos":
        result = await restoreVideo(target.item.id, userId);
        break;
      case "applications":
        result = await restoreApplication(target.item.id, userId);
        break;
      case "categories":
        result = await restoreCategory(target.item.id);
        break;
      default:
        return;
    }

    if (!result.success) {
      notifications.show({
        title: "復活失敗",
        message: getErrorMessage(result.error),
        color: "red",
      });
      return;
    }

    notifications.show({
      title: "復活完了",
      message: `${TAB_LABELS[target.type]}「${target.item.name}」を復活しました。`,
      color: "green",
    });

    onClose();
    router.refresh();
  };

  const isCategory = target?.type === "categories";

  return (
    <Modal opened={opened} onClose={onClose} title="復活の確認" centered>
      <Text mb="xs">「{target?.item.name ?? ""}」を復活しますか？</Text>
      <Text size="sm" c="dimmed" mb="xs">
        ※元のカテゴリーに復活されます。
      </Text>
      <Text size="sm" c="dimmed" mb="md">
        ※表示順は末尾に配置されます。
      </Text>
      {isCategory && (
        <Text size="sm" c="orange" mb="md">
          ※削除時に「未分類」へ移動されたコンテンツは自動では戻りません。
          必要に応じて手動でカテゴリーを再割り当てしてください。
        </Text>
      )}

      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          キャンセル
        </Button>
        <Button onClick={handleRestore}>復活</Button>
      </Group>
    </Modal>
  );
}
