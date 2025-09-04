import { Modal, Text, Stack, Group, Avatar } from "@mantine/core";
import type { MemberType } from "@/app/types";

interface MemberDetailModalProps {
  opened: boolean;
  onClose: () => void;
  userInfo: MemberType;
}

export function MemberDetailModal({ opened, onClose, userInfo }: MemberDetailModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={`メンバーのご紹介`} centered size="md">
      <Stack gap="lg">
        <Group align="center" gap="md">
          <Avatar size="lg" radius="md" alt={userInfo.display_name} />
          <Stack gap="xs">
            <Text size="xl" fw={600}>
              {userInfo.display_name}
            </Text>
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
