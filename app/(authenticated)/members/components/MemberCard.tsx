"use client";

import { MemberType } from "@/app/types";
import { Card, Avatar, Text, Group } from "@mantine/core";
import { MemberDetailModal } from "./MemberDetailModal";
import { useState } from "react";

interface MemberCardProps {
  member: MemberType;
}

export function MemberCard({ member }: MemberCardProps) {
  const [modalOpened, setModalOpened] = useState(false);

  const avatarContent = member.display_name.charAt(0).toUpperCase();

  const handleOpenModal = () => {
    setModalOpened(true);
  };

  return (
    <div>
      <Card shadow="sm" padding="lg" radius="md" withBorder onClick={handleOpenModal}>
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
      <MemberDetailModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        userInfo={member}
      />
    </div>
  );
}
