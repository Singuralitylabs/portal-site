"use client";

import { MemberType } from "@/app/types";
import { Card, Avatar, Text, Group } from "@mantine/core";
import { MemberDetailModal } from "./MemberDetailModal";
import { useState } from "react";
import { MarkdownText } from "@/app/components/MarkdownText";

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
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        onClick={handleOpenModal}
        style={{ cursor: "pointer" }}
      >
        <Group align="flex-start" gap="sm">
          <Avatar src={member.avatar_url} color="blue" radius="xl">
            {!member.avatar_url && avatarContent}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Group align="flex-start" gap="md" mb={8} style={{ minHeight: "2.5em", marginBottom: 8 }} wrap="nowrap">
              <Text fw={500} size="lg" truncate>
                {member.display_name}
              </Text>
              {member.position_tags && member.position_tags.length > 0 && (
                <Group gap={6} style={{ maxWidth: "60%", flexWrap: "wrap", maxHeight: "2.5em", overflow: "hidden" }}>
                  {member.position_tags.map((tag) => (
                    <Badge
                      key={tag.positions.id}
                      size="xs"
                      variant="light"
                      color="blue"
                      style={{ fontSize: "0.5rem" }}
                    >
                      {tag.positions.name}
                    </Badge>
                  ))}
                </Group>
              )}
            </Group>
            <Text size="sm" c="dimmed" lineClamp={3} style={{ minHeight: "4.5em" }}>
              <MarkdownText>{member.bio || ""}</MarkdownText>
            </Text>
          </div>
        </Group>
      </Card>
      <MemberDetailModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        memberInfo={member}
      />
    </div>
  );
}
