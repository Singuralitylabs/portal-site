"use client";

import { MemberType } from "@/app/types";
import { Card, Avatar, Text, Group, Badge } from "@mantine/core";
import { MemberDetailModal } from "./MemberDetailModal";
import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/app/services/api/supabase-client";

interface MemberCardProps {
  member: MemberType;
}

export function MemberCard({ member }: MemberCardProps) {
  const [modalOpened, setModalOpened] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!member.profile_image_path) return;
    const supabase = createClientSupabaseClient();
    supabase.storage
      .from("profile-images")
      .createSignedUrl(member.profile_image_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) {
          setProfileImageUrl(`${data.signedUrl}&t=${Date.now()}`);
        }
      });
  }, [member.profile_image_path]);

  const avatarSrc = profileImageUrl ?? member.avatar_url ?? null;
  const avatarContent = member.display_name.charAt(0).toUpperCase();

  return (
    <div>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        onClick={() => setModalOpened(true)}
        style={{ cursor: "pointer" }}
      >
        <Group align="flex-start" gap="sm">
          <Avatar src={avatarSrc} color="blue" radius="xl">
            {!avatarSrc && avatarContent}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Group
              align="flex-start"
              gap="md"
              mb={8}
              style={{ minHeight: "2.5em", marginBottom: 8 }}
              wrap="nowrap"
            >
              <Text fw={500} size="lg" truncate>
                {member.display_name}
              </Text>
              {member.position_tags && member.position_tags.length > 0 && (
                <Group
                  gap={6}
                  style={{
                    maxWidth: "60%",
                    flexWrap: "wrap",
                    maxHeight: "2.5em",
                    overflow: "hidden",
                  }}
                >
                  {member.position_tags.map(
                    tag =>
                      tag.positions && (
                        <Badge
                          key={tag.positions.id}
                          size="xs"
                          variant="light"
                          color="blue"
                          style={{ fontSize: "0.5rem" }}
                        >
                          {tag.positions.name}
                        </Badge>
                      )
                  )}
                </Group>
              )}
            </Group>
            <Text size="sm" c="dimmed" lineClamp={3} style={{ minHeight: "4.5em" }}>
              {member.bio || ""}
            </Text>
          </div>
        </Group>
      </Card>
      <MemberDetailModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        memberInfo={member}
        profileImageUrl={profileImageUrl}
      />
    </div>
  );
}
