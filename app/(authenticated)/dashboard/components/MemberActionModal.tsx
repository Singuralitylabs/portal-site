"use client";

import { useRouter } from "next/navigation";
import { UserActionType, PendingUserType } from "@/app/types";
import { approveUser, rejectUser } from "@/app/services/api/users-client";
import { USER_ACTION } from "@/app/constants/user";
import { Button, Group, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";

interface MemberActionModalProps {
  opened: boolean;
  onClose: () => void;
  type: UserActionType;
  member: PendingUserType;
}

export default function MemberActionModal({
  opened,
  onClose,
  type,
  member,
}: MemberActionModalProps) {
  const router = useRouter();

  const isApprove = type === USER_ACTION.APPROVE;
  const actionLabel = isApprove ? "承認" : "否認";

  const handleConfirm = async () => {
    try {
      if (isApprove) {
        const { error } = await approveUser({ userId: member.id });
        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await rejectUser({ userId: member.id });
        if (error) {
          throw new Error(error.message);
        }
      }

      onClose();
      notifications.show({
        title: `${actionLabel}完了`,
        message: `${member.display_name} さんを${actionLabel}しました。`,
        color: isApprove ? "green" : "blue",
      });
      router.refresh();
    } catch (err: unknown) {
      onClose();
      notifications.show({
        title: `${actionLabel}失敗`,
        message: err instanceof Error ? err.message : "予期しないエラーが発生しました",
        color: "red",
      });
      console.error(`${actionLabel} 実行失敗`, err);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`${actionLabel}確認`} centered>
      <Text mb="md">
        {member.display_name} さんを{actionLabel}しますか？
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          キャンセル
        </Button>
        <Button color={isApprove ? "blue" : "red"} onClick={handleConfirm}>
          {actionLabel}
        </Button>
      </Group>
    </Modal>
  );
}
