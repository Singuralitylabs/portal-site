import { Modal, Text, Stack, Group, Avatar, Anchor, Badge } from "@mantine/core";
import type { MemberType } from "@/app/types";

interface MemberDetailModalProps {
  opened: boolean;
  onClose: () => void;
  memberInfo: MemberType;
}

export function MemberDetailModal({ opened, onClose, memberInfo }: MemberDetailModalProps) {
  const hasLinks =
    memberInfo.x_url ||
    memberInfo.facebook_url ||
    memberInfo.instagram_url ||
    memberInfo.github_url ||
    memberInfo.portfolio_url;

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
                {memberInfo.position_tags.map(
                  tag =>
                    tag.positions && (
                      <Badge key={tag.positions.id} variant="light" size="sm">
                        {tag.positions.name}
                      </Badge>
                    )
                )}
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

        {hasLinks && (
          <Group gap="md" mt="xs">
            {memberInfo.x_url && (
              <Anchor
                href={memberInfo.x_url || ""}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                X URL
              </Anchor>
            )}
            {memberInfo.facebook_url && (
              <Anchor
                href={memberInfo.facebook_url || ""}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                Facebook URL
              </Anchor>
            )}
            {memberInfo.instagram_url && (
              <Anchor
                href={memberInfo.instagram_url || ""}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                Instagram URL
              </Anchor>
            )}
            {memberInfo.github_url && (
              <Anchor
                href={memberInfo.github_url || ""}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                GitHub URL
              </Anchor>
            )}
            {memberInfo.portfolio_url && (
              <Anchor
                href={memberInfo.portfolio_url || ""}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                ポートフォリオサイトのURL
              </Anchor>
            )}
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
