import { deleteVideo } from "@/app/services/api/videos-client";
import { Button, Group, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

interface VideoDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  userId: number;
  videoId: number;
}

export function VideoDeleteModal({ opened, onClose, userId, videoId }: VideoDeleteModalProps) {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const result = await deleteVideo(videoId, userId);
      onClose();
      if (result?.success) {
        notifications.show({
          title: "削除完了",
          message: "動画を削除しました。",
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
      <Text mb="md">本当にこの動画を削除しますか？</Text>
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
