import { deleteApplication } from "@/app/services/api/applications-client";
import { Button, Group, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

interface ApplicationDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  userId: number;
  applicationId: number;
}

export function ApplicationDeleteModal({
  opened,
  onClose,
  userId,
  applicationId,
}: ApplicationDeleteModalProps) {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const result = await deleteApplication(applicationId, userId);
      onClose();
      if (result?.success) {
        notifications.show({
          title: "削除完了",
          message: "アプリを削除しました。",
          color: "green",
        });
        router.refresh();
      } else {
        notifications.show({
          title: "削除失敗",
          message: String(result?.error) || "不明なエラー",
          color: "red",
        });
      }
    } catch (e) {
      onClose();
      notifications.show({
        title: "エラー",
        message: "削除処理で予期しないエラーが発生しました",
        color: "red",
      });
      console.error(e);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="削除の確認" centered>
      <Text mb="md">本当にこのアプリを削除しますか？</Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          キャンセル
        </Button>
        <Button color="red" onClick={handleDelete}>
          削除
        </Button>
      </Group>
    </Modal>
  );
}
