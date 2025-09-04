"use client";

import { MemberType } from "@/app/types";
import { Card, Avatar, Text, Badge, Group } from "@mantine/core";

interface MemberCardProps {
  member: MemberType;
}

export function MemberCard({ member }: MemberCardProps) {
  const avatarContent = member.display_name.charAt(0).toUpperCase();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group align="flex-start" gap="sm">
        <Avatar color="blue" radius="xl">
          {avatarContent}
        </Avatar>
        <div style={{ flex: 1 }}>
          <Text fw={500} size="lg" mb={4}>
            {member.display_name}
          </Text>
          {member.bio && (
            <Text size="sm" c="dimmed" lineClamp={3}>
              {member.bio}
            </Text>
          )}
        </div>
      </Group>
    </Card>
  );
}
