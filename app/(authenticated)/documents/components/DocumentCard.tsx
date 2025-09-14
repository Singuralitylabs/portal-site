"use client";

import { DocumentWithCategoryType } from "@/app/types";
import { EllipsisVertical, FileText, FileType } from "lucide-react";
import { Button, Card, Flex, Text, Menu } from "@mantine/core";

interface DocumentCardProps {
  document: DocumentWithCategoryType;
  isContentMgr: boolean;
  onEdit: (document: DocumentWithCategoryType) => void;
  onDelete: (documentId: number) => void;
}

export function DocumentCard({ document, isContentMgr, onEdit, onDelete }: DocumentCardProps) {
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
            <Menu>
              <Menu.Target>
                <Button
                  variant="subtle"
                  size="compact-xs"
                  p="4px"
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    borderRadius: "4px",
                  }}
                >
                  <EllipsisVertical size={16} />
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => onEdit(document)}>編集</Menu.Item>
                <Menu.Item onClick={() => onDelete(document.id)}>削除</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Flex>
      </Card.Section>

      <div className="flex-1 p-4 overflow-hidden">
        <Text component="div" lineClamp={4} className="overflow-hidden">
          {document.description}
        </Text>
      </div>

      <div className="p-4 pt-0">
        <Button
          color="#000"
          component="a"
          href={document.url}
          fullWidth
          target="_blank"
          rel="noopener noreferrer"
        >
          資料を開く
        </Button>
      </div>
    </Card>
  );
}
