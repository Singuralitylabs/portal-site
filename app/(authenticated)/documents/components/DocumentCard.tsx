"use client";

import { DocumentWithCategoryType } from "@/app/types";
import { FileText, FileType, Calendar } from "lucide-react";
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
    <Card component="div" shadow="sm" padding="lg" radius="md" w="100%" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Flex gap="0.25rem" justify="space-between" align="center" direction="row">
          <Flex gap="0.25rem" align="center" direction="row">
            <div>{getFileTypeIcon("pdf")}</div>
            <div>{document.name}</div>
          </Flex>
          {isContentMgr && (
            <Menu>
              <Menu.Target>
                <Button color="lightgray">
                  <Text fz="lg">⋮</Text>
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => onEdit(document)}>
                  編集
                </Menu.Item>
                <Menu.Item onClick={() => onDelete(document.id)}>
                  削除
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Flex>
      </Card.Section>
      <Card.Section>
        <Text component="div" p="1rem">
          {document.description}
        </Text>
        <Flex gap="0.25rem" justify="flex-start" align="center" direction="row" p="0 1rem 1rem">
          <Calendar style={{ width: "1rem", height: "1rem" }} />
          <Text component="div" fs="0.875rem" lh="1.25rem">
            {new Date(document.updated_at)
              .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
              .replaceAll("/", "-")}
          </Text>
          <Button
            component="div"
            radius="md"
            size="compact-sm"
            c="rgb(23,23,23)"
            bg="gray.2"
            fs="0.875rem"
            lh="1.25rem"
            ml="0.5rem"
          >
            {document.category?.name}
          </Button>
        </Flex>
        <Button
          color="#000"
          component="a"
          href={document.url}
          w={"100% - 2rem"}
          m="0 1rem 1rem"
          display="block"
          target="_blank"
          rel="noopener noreferrer"
        >
          資料を開く
        </Button>
      </Card.Section>
    </Card >
  );
}
