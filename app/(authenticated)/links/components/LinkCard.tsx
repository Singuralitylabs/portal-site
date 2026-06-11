"use client";

import { Button, Card, Flex, Text } from "@mantine/core";
import Image from "next/image";
import { QUICK_LINK_FALLBACK_LOGO } from "@/app/constants/links";
import { QuickLinkDisplayModeType, QuickLinkType } from "@/app/types";

interface LinkCardProps {
  link: QuickLinkType;
  displayMode: QuickLinkDisplayModeType;
  onDetailClick?: (link: QuickLinkType) => void;
}

export function LinkCard({ link, displayMode, onDetailClick }: LinkCardProps) {
  const cardContent = (
    <>
      <Card.Section withBorder inheritPadding p="xs" className="bg-emerald-50">
        <Flex gap="0.5rem" align="center" direction="row">
          <Image
            src={link.logoPath ?? QUICK_LINK_FALLBACK_LOGO}
            alt={`${link.name}のロゴ`}
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <div className="font-semibold">{link.name}</div>
        </Flex>
      </Card.Section>

      <div className="flex-1 p-4">
        <Text component="div">{link.description}</Text>
      </div>
    </>
  );

  // 直リンク方式：カード全体をリンクとして新タブで開く
  if (displayMode === "direct") {
    return (
      <Card
        component="a"
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        shadow="sm"
        padding="0"
        radius="md"
        withBorder
        className="w-full h-full min-h-[14rem] flex flex-col transition-shadow hover:shadow-md"
      >
        {cardContent}
      </Card>
    );
  }

  // 詳細モーダル方式：「詳細」ボタンでモーダルを開く
  return (
    <Card
      component="div"
      shadow="sm"
      padding="0"
      radius="md"
      withBorder
      className="w-full h-full min-h-[14rem] flex flex-col"
    >
      {cardContent}
      <div className="p-4 pt-0">
        <Button color="dark" fullWidth onClick={() => onDetailClick?.(link)}>
          詳細
        </Button>
      </div>
    </Card>
  );
}
