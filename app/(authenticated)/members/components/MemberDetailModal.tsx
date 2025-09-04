import { Modal, Text, Stack, Group, Avatar, Badge } from "@mantine/core";
import type { MemberType } from "@/app/types";
import { USER_ROLE } from "@/app/constants/user";

interface MemberDetailModalProps {
  opened: boolean;
  onClose: () => void;
  userInfo: MemberType;
}

export function MemberDetailModal({ opened, onClose, userInfo }: MemberDetailModalProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case USER_ROLE.ADMIN:
        return "red";
      case USER_ROLE.MAINTAINER:
        return "green";
      case USER_ROLE.MEMBER:
        return "blue";
      default:
        return "gray";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case USER_ROLE.ADMIN:
        return "管理者";
      case USER_ROLE.MAINTAINER:
        return "コンテンツ管理者";
      case USER_ROLE.MEMBER:
        return "メンバー";
      default:
        return role;
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`メンバーのご紹介`} centered size="md">
      <Stack gap="lg">
        <Group align="center" gap="md">
          <Avatar size="lg" radius="md" alt={userInfo.display_name} />
          <Stack gap="xs">
            <Text size="xl" fw={600}>
              {userInfo.display_name}
            </Text>
            <Badge color={getRoleColor(userInfo.role)} variant="light">
              {getRoleLabel(userInfo.role)}
            </Badge>
          </Stack>
        </Group>

        {userInfo.bio && (
          <Stack gap="xs">
            <Text size="md" fw={500}>
              自己紹介
            </Text>
            <Text size="sm" c="dimmed">
              {userInfo.bio}
            </Text>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
