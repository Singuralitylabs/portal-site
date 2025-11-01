"use client";

import { AppWithCategoryAndDeveloperType } from "@/app/types";
import { Modal, Button, Badge, Image, Text, Stack } from "@mantine/core";
import { ExternalLink, User } from "lucide-react";

interface AppDetailModalProps {
  app: AppWithCategoryAndDeveloperType | null;
  opened: boolean;
  onClose: () => void;
}

export function AppDetailModal({ app, opened, onClose }: AppDetailModalProps) {
  if (!app) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="アプリ詳細"
      size="lg"
      centered
      styles={{
        title: {
          fontSize: "1.5rem",
          fontWeight: "bold",
        },
      }}
    >
      <Stack gap="md">
        <h2 className="text-2xl font-bold">{app.name}</h2>

        {app.thumbnail_url && (
          <Image
            src={app.thumbnail_url}
            alt={app.name}
            radius="md"
            className="w-full"
            fallbackSrc="https://placehold.co/600x400?text=No+Image"
          />
        )}

        <div>
          <Text size="sm" c="dimmed" mb="xs">
            詳細説明
          </Text>
          <Text style={{ whiteSpace: "pre-wrap" }}>{app.description}</Text>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {app.category && (
            <div>
              <Text size="sm" c="dimmed" component="span" mr="xs">
                カテゴリー:
              </Text>
              <Badge variant="light">{app.category.name}</Badge>
            </div>
          )}
        </div>

        {app.developer && (
          <div className="flex items-center gap-2">
            <User size={16} />
            <Text size="sm">
              開発者: <span className="font-semibold">{app.developer.display_name}</span>
            </Text>
          </div>
        )}

        <Button
          color="#000"
          fullWidth
          component="a"
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          rightSection={<ExternalLink size={16} />}
        >
          アプリを開く
        </Button>
      </Stack>
    </Modal>
  );
}
