"use client";

import { ApplicationWithCategoryAndDeveloperType } from "@/app/types";
import { Modal, Button, Badge, Image, Text, Stack } from "@mantine/core";
import { ExternalLink, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ApplicationDetailModalProps {
  application: ApplicationWithCategoryAndDeveloperType | null;
  opened: boolean;
  onClose: () => void;
}

export function ApplicationDetailModal({
  application,
  opened,
  onClose,
}: ApplicationDetailModalProps) {
  if (!application) return null;

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
        <h2 className="text-2xl font-bold">{application.name}</h2>

        {application.thumbnail_path && (
          <Image
            src={application.thumbnail_path}
            alt={application.name}
            radius="md"
            className="w-full"
            fallbackSrc="https://placehold.co/600x400?text=No+Image"
          />
        )}

        <div>
          <Text size="sm" c="dimmed" mb="xs">
            詳細説明
          </Text>
          <Text style={{ whiteSpace: "pre-wrap" }}>
            <ReactMarkdown>{application.description}</ReactMarkdown>
          </Text>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {application.category && (
            <div>
              <Text size="sm" c="dimmed" component="span" mr="xs">
                カテゴリー:
              </Text>
              <Badge variant="light">{application.category.name}</Badge>
            </div>
          )}
        </div>

        {application.developer && (
          <div className="flex items-center gap-2">
            <User size={16} />
            <Text size="sm">
              開発者: <span className="font-semibold">{application.developer.display_name}</span>
            </Text>
          </div>
        )}

        <Button
          color="#000"
          fullWidth
          component="a"
          href={application.url}
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
