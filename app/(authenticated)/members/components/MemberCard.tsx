"use client";

import { USER_ROLE } from "@/app/constants/user";
import { MemberType } from "@/app/types";
import { Card, Avatar, Text, Badge, Group } from "@mantine/core";

interface MemberCardProps {
  member: MemberType;
}

export function MemberCard({ member }: MemberCardProps) {
  const avatarContent = member.display_name.charAt(0).toUpperCase();

  const getRoleColor = (role: string) => {
    switch (role) {
      case USER_ROLE.ADMIN:
        return "red";
      case USER_ROLE.MAINTAINER:
        return "blue";
      case USER_ROLE.MEMBER:
        return "green";
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
        return "不明";
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group align="flex-start" gap="sm">
        <Avatar color="blue" radius="sm">
          {avatarContent}
        </Avatar>
        <div style={{ flex: 1 }}>
          <div className="flex items-center justify-between">
            <Text fw={500} size="lg" mb={4}>
              {member.display_name}
            </Text>
            <Badge color={getRoleColor(member.role)} variant="light" size="sm" mb={8}>
              {getRoleLabel(member.role)}
            </Badge>
          </div>
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
