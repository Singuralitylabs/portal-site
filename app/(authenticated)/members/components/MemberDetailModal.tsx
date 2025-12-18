import { Modal, Text, Stack, Group, Avatar, Badge } from "@mantine/core";
import type { MemberType } from "@/app/types";

interface MemberDetailModalProps {
  opened: boolean;
  onClose: () => void;
  memberInfo: MemberType;
}

export function MemberDetailModal({ opened, onClose, memberInfo }: MemberDetailModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={`メンバーのご紹介`} centered size="xl">
      <Stack gap="lg">
        <Group align="center" gap="md">
          <Avatar src={memberInfo.avatar_url} size="lg" radius="md" alt={memberInfo.display_name} />
          <Stack gap="xs">
            <Text size="xl" fw={600}>
              {memberInfo.display_name}
            </Text>
            {memberInfo.position_tags && memberInfo.position_tags.length > 0 && (
              <Group gap="xs">
                {memberInfo.position_tags.map((tag, index) => (
                  tag.positions && (
                    <Badge key={index} variant="light" size="sm">
                      {tag.positions.name}
                    </Badge>
                  )
                ))}
              </Group>
            )}
          </Stack>
        </Group>

        {memberInfo.bio && (
          <Stack gap="xs">
            <Text size="md" fw={500}>
              自己紹介
            </Text>
            <Text size="sm" c="dimmed">
              {memberInfo.bio}
            </Text>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
