"use client";

import { DocumentWithCategoryType } from "@/app/types";
import { Modal, Button, Badge, Text, Stack } from "@mantine/core";
import { ExternalLink } from "lucide-react";
import { MarkdownText } from "@/app/components/MarkdownText";

interface DocumentDetailModalProps {
  document: DocumentWithCategoryType | null;
  opened: boolean;
  onClose: () => void;
}

export function DocumentDetailModal({
  document,
  opened,
  onClose,
}: DocumentDetailModalProps) {
  if (!document) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="資料詳細"
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
        <h2 className="text-2xl font-bold">{document.name}</h2>

        <div>
          <Text size="sm" c="dimmed" mb="xs">
            詳細説明
          </Text>
          <Text className="prose prose-sm max-w-none" component="div">
            <MarkdownText>{document.description}</MarkdownText>
          </Text>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {document.category && (
            <div>
              <Text size="sm" c="dimmed" component="span" mr="xs">
                カテゴリー:
              </Text>
              <Badge variant="light">{document.category.name}</Badge>
            </div>
          )}
        </div>

        <Button
          color="#000"
          fullWidth
          component="a"
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          rightSection={<ExternalLink size={16} />}
        >
          資料を開く
        </Button>
      </Stack>
    </Modal>
  );
}
