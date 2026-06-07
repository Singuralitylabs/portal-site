"use client";

import { Modal, Button, Text, Stack, Flex } from "@mantine/core";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { QUICK_LINK_FALLBACK_LOGO } from "@/app/constants/links";
import { QuickLinkType } from "@/app/types";

interface LinkDetailModalProps {
  link: QuickLinkType | null;
  opened: boolean;
  onClose: () => void;
}

export function LinkDetailModal({ link, opened, onClose }: LinkDetailModalProps) {
  if (!link) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="サービス詳細"
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
        <Flex gap="0.5rem" align="center" direction="row">
          <Image
            src={link.logoPath ?? QUICK_LINK_FALLBACK_LOGO}
            alt={`${link.name}のロゴ`}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <h2 className="text-2xl font-bold">{link.name}</h2>
        </Flex>

        {link.headerImagePath && (
          <Image
            src={link.headerImagePath}
            alt={`${link.name}のヘッダー画像`}
            width={800}
            height={450}
            className="w-full h-auto rounded-md"
          />
        )}

        <div>
          <Text size="sm" c="dimmed" mb="xs">
            詳細説明
          </Text>
          <Text className="prose prose-sm max-w-none" component="div">
            {link.detailDescription ?? link.description}
          </Text>
        </div>

        <Button
          color="#000"
          fullWidth
          component="a"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          rightSection={<ExternalLink size={16} />}
        >
          {link.name}を開く
        </Button>
      </Stack>
    </Modal>
  );
}
