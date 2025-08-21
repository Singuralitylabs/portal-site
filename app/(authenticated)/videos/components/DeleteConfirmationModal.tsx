'use client';

import { Modal, Text, Button, Group } from '@mantine/core';

interface DeleteConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function DeleteConfirmationModal({ 
  opened, 
  onClose, 
  onConfirm, 
  title = "削除の確認",
  message = "本当にこの動画を削除しますか？"
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
    >
      <Text mb="md">{message}</Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          キャンセル
        </Button>
        <Button color="red" onClick={onConfirm}>
          削除
        </Button>
      </Group>
    </Modal>
  );
}