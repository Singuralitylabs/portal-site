"use client";

import { DocumentWithCategoryType, SelectCategoryType } from "@/app/types";
import { FileText, FileType } from "lucide-react";
import { Button, Card, Flex, Text } from "@mantine/core";
import ContentMgrMenu from "@/app/(authenticated)/components/ContentMgrMenu";
import { CONTENT_TYPE } from "@/app/constants/content";

interface DocumentCardProps {
  document: DocumentWithCategoryType;
  isContentMgr: boolean;
  categories: SelectCategoryType[];
  userId: number;
  onDetailClick: (document: DocumentWithCategoryType) => void;
}

export function DocumentCard({ document, isContentMgr, categories, userId, onDetailClick }: DocumentCardProps) {
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText style={{ width: "1.25rem", height: "1.25rem" }} />;
      default:
        return <FileType style={{ width: "1.25rem", height: "1.25rem" }} />;
    }
  };

  return (
    <Card
      component="div"
      shadow="sm"
      padding="0"
      radius="md"
      withBorder
      className="w-full aspect-[4/3] flex flex-col"
    >
      <Card.Section withBorder inheritPadding p="xs">
        <Flex gap="0.25rem" justify="space-between" align="center" direction="row">
          <Flex gap="0.25rem" align="center" direction="row">
            <div>{getFileTypeIcon("pdf")}</div>
            <div>{document.name}</div>
          </Flex>
          {isContentMgr && (
            <ContentMgrMenu<DocumentWithCategoryType>
              content={document}
              categories={categories}
              userId={userId}
              type={CONTENT_TYPE.DOCUMENT}
            />
          )}
        </Flex>
      </Card.Section>

      <div className="flex-1 p-4 overflow-hidden">
        <Text component="div" lineClamp={4} className="overflow-hidden prose prose-sm max-w-none">
          {document.description}
        </Text>
      </div>

      <div className="p-4 pt-0">
        <Button color="#000" fullWidth onClick={() => onDetailClick(document)}>
          詳細
        </Button>
      </div>
    </Card>
  );
}
