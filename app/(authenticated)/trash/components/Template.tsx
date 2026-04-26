"use client";

import { useMemo, useState } from "react";
import { Button, Paper, Table, Tabs, Text } from "@mantine/core";
import { RotateCcw } from "lucide-react";
import { PageTitle } from "@/app/components/PageTitle";
import type { TrashTabType, TrashContentItem, TrashCategoryItem } from "@/app/types";
import { RestoreModal } from "./RestoreModal";

interface TrashPageTemplateProps {
  userId: number;
  initialData: {
    documents: TrashContentItem[];
    videos: TrashContentItem[];
    applications: TrashContentItem[];
    categories: TrashCategoryItem[];
  };
}

const TAB_LABELS: Record<TrashTabType, string> = {
  documents: "資料",
  videos: "動画",
  applications: "アプリ",
  categories: "カテゴリー",
};

const CATEGORY_TYPE_LABELS: Record<string, string> = {
  documents: "資料",
  videos: "動画",
  applications: "アプリ",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function TrashPageTemplate({ userId, initialData }: TrashPageTemplateProps) {
  const [activeTab, setActiveTab] = useState<TrashTabType>("documents");
  const [restoreTarget, setRestoreTarget] = useState<{
    type: TrashTabType;
    item: TrashContentItem | TrashCategoryItem;
  } | null>(null);

  const currentItems = useMemo(() => {
    return initialData[activeTab];
  }, [initialData, activeTab]);

  const openRestoreModal = (item: TrashContentItem | TrashCategoryItem) => {
    setRestoreTarget({ type: activeTab, item });
  };

  const isContentTab = activeTab !== "categories";

  return (
    <>
      <PageTitle>ゴミ箱</PageTitle>

      <Tabs
        value={activeTab}
        onChange={value => setActiveTab((value as TrashTabType) || "documents")}
        mt="md"
        mb="md"
      >
        <Tabs.List>
          {Object.entries(TAB_LABELS).map(([value, label]) => (
            <Tabs.Tab key={value} value={value}>
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      {currentItems.length > 0 ? (
        <Paper withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>アイテム名</Table.Th>
                {isContentTab && <Table.Th>カテゴリー</Table.Th>}
                {!isContentTab && <Table.Th>種別</Table.Th>}
                <Table.Th>削除日時</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentItems.map(item => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.name}</Table.Td>
                  {isContentTab && (
                    <Table.Td>
                      {(item as TrashContentItem).category?.name ?? "未分類"}
                    </Table.Td>
                  )}
                  {!isContentTab && (
                    <Table.Td>
                      {CATEGORY_TYPE_LABELS[(item as TrashCategoryItem).category_type]}
                    </Table.Td>
                  )}
                  <Table.Td>{formatDate(item.updated_at)}</Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<RotateCcw size={14} />}
                      onClick={() => openRestoreModal(item)}
                    >
                      復活
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          削除済みの{TAB_LABELS[activeTab]}はありません。
        </Text>
      )}

      <RestoreModal
        opened={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        target={restoreTarget}
        userId={userId}
      />
    </>
  );
}
