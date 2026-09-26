"use client";

import { useMemo, useRef, useState } from "react";
import { Badge, Group, Paper, ScrollArea, Table, Tabs, Text } from "@mantine/core";
import { PageTitle } from "@/app/components/PageTitle";
import type {
  MasterManagementData,
  MasterRecord,
  MasterRecordField,
} from "@/app/services/api/master-server";
import type { MasterTableName } from "@/app/constants/master";

interface MasterPageTemplateProps {
  initialData: MasterManagementData;
}

const MASTER_DISPLAY_TIME_ZONE = "Asia/Tokyo";

function parseUtcTimestamp(value: string): Date {
  const hasExplicitTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  return new Date(hasExplicitTimeZone ? value : `${value}Z`);
}

function formatDateTime(value: string): string {
  const date = parseUtcTimestamp(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MASTER_DISPLAY_TIME_ZONE,
  });
}

function formatFieldValue(field: MasterRecordField): string {
  if (field.referenceLabel) {
    return field.referenceLabel;
  }

  if (field.value === null) {
    return "-";
  }

  if (typeof field.value === "boolean") {
    return field.value ? "はい" : "いいえ";
  }

  // master 画面では *_at 命名の文字列を日時として統一表示する。
  if (field.key.endsWith("_at") && typeof field.value === "string") {
    return formatDateTime(field.value);
  }

  return String(field.value);
}

function FieldValue({ field }: { field: MasterRecordField }) {
  if (field.key !== "is_deleted" || typeof field.value !== "boolean") {
    return <>{formatFieldValue(field)}</>;
  }

  return (
    <Badge color={field.value ? "red" : "green"} variant="light">
      {field.value ? "削除済み" : "有効"}
    </Badge>
  );
}

function getRecordTitle(record: MasterRecord): string {
  const nameField = record.fieldMap.name;
  const formattedName = nameField ? formatFieldValue(nameField) : "";
  return formattedName !== "-" ? formattedName : `ID: ${record.id}`;
}

export function MasterPageTemplate({ initialData }: MasterPageTemplateProps) {
  // 初期表示は先頭テーブル・先頭レコードを選び、空データ時だけ null にフォールバックする。
  const [activeTableName, setActiveTableName] = useState<MasterTableName>(
    initialData.tables[0]?.tableName ?? "documents"
  );
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(
    initialData.tables[0]?.records[0]?.id ?? null
  );
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

  const activeTable = useMemo(
    () =>
      initialData.tables.find(table => table.tableName === activeTableName) ??
      initialData.tables[0],
    [activeTableName, initialData.tables]
  );

  const selectedRecord = useMemo(() => {
    if (!activeTable) {
      return null;
    }

    return (
      activeTable.records.find(record => record.id === selectedRecordId) ??
      activeTable.records[0] ??
      null
    );
  }, [activeTable, selectedRecordId]);

  const listFields = useMemo(() => {
    if (!activeTable?.records[0]) {
      return [];
    }

    // 一覧ヘッダーは同一テーブル内で共通のため、先頭レコードの field 定義を列見出しとして使う。
    return activeTable.listColumnKeys
      .map(key => activeTable.records[0].fieldMap[key])
      .filter((field): field is MasterRecordField => Boolean(field));
  }, [activeTable]);

  const handleTableChange = (value: string | null) => {
    const nextTableName = (value as MasterTableName | null) ?? "documents";
    const nextTable = initialData.tables.find(table => table.tableName === nextTableName);
    setActiveTableName(nextTableName);
    setSelectedRecordId(nextTable?.records[0]?.id ?? null);
  };

  const handleRecordSelect = (recordId: number) => {
    setSelectedRecordId(recordId);
  };

  const focusRecordRow = (recordId: number) => {
    rowRefs.current[recordId]?.focus();
  };

  const moveSelectedRecord = (direction: "prev" | "next" | "first" | "last") => {
    if (!activeTable || activeTable.records.length === 0) {
      return;
    }

    const selectedIndex = activeTable.records.findIndex(record => record.id === selectedRecord?.id);
    const fallbackIndex = selectedIndex >= 0 ? selectedIndex : 0;

    const nextIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? activeTable.records.length - 1
          : direction === "prev"
            ? Math.max(fallbackIndex - 1, 0)
            : Math.min(fallbackIndex + 1, activeTable.records.length - 1);

    const nextRecord = activeTable.records[nextIndex];
    if (!nextRecord) {
      return;
    }

    handleRecordSelect(nextRecord.id);
    focusRecordRow(nextRecord.id);
  };

  const handleRecordKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    recordId: number
  ) => {
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        handleRecordSelect(recordId);
        return;
      case "ArrowUp":
        event.preventDefault();
        moveSelectedRecord("prev");
        return;
      case "ArrowDown":
        event.preventDefault();
        moveSelectedRecord("next");
        return;
      case "Home":
        event.preventDefault();
        moveSelectedRecord("first");
        return;
      case "End":
        event.preventDefault();
        moveSelectedRecord("last");
        return;
      default:
        return;
    }
  };

  return (
    <>
      <PageTitle>マスター管理</PageTitle>

      <Tabs value={activeTableName} onChange={handleTableChange} mt="md" mb="md">
        <Tabs.List>
          {initialData.tables.map(table => (
            <Tabs.Tab key={table.tableName} value={table.tableName}>
              {table.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      {activeTable ? (
        <div className="grid h-[calc(100dvh-13rem)] min-h-[32rem] grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-rows-1">
          <Paper withBorder className="flex min-h-0 flex-col overflow-hidden">
            <Group justify="space-between" p="md" pb="xs">
              <Text fw={700}>{activeTable.label}</Text>
              <Badge variant="light">件数: {activeTable.records.length}</Badge>
            </Group>

            {activeTable.records.length > 0 ? (
              <ScrollArea className="min-h-0 flex-1">
                <Table highlightOnHover verticalSpacing="sm" miw={720}>
                  <caption className="sr-only">
                    {activeTable.label}
                    の一覧です。上下キーで行を移動し、EnterまたはSpaceで詳細を選択できます。
                  </caption>
                  <Table.Thead>
                    <Table.Tr>
                      {listFields.map(field => (
                        <Table.Th key={field.key} scope="col">
                          {field.label}
                        </Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {activeTable.records.map(record => (
                      <Table.Tr
                        key={record.id}
                        ref={node => {
                          rowRefs.current[record.id] = node;
                        }}
                        bg={
                          selectedRecord?.id === record.id
                            ? "var(--mantine-color-blue-0)"
                            : undefined
                        }
                        className="cursor-pointer"
                        onClick={() => handleRecordSelect(record.id)}
                        onKeyDown={event => handleRecordKeyDown(event, record.id)}
                        tabIndex={selectedRecord?.id === record.id ? 0 : -1}
                        aria-current={selectedRecord?.id === record.id ? "true" : undefined}
                      >
                        {activeTable.listColumnKeys.map(key => {
                          const field = record.fieldMap[key];
                          return (
                            <Table.Td key={key} maw={260} className="truncate">
                              {field ? <FieldValue field={field} /> : "-"}
                            </Table.Td>
                          );
                        })}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                表示できるレコードはありません。
              </Text>
            )}
          </Paper>

          <Paper withBorder p="md" className="flex min-h-0 flex-col overflow-hidden">
            {selectedRecord ? (
              <>
                <Text fw={700} mb="xs">
                  {getRecordTitle(selectedRecord)}
                </Text>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="space-y-3 pr-1">
                    {selectedRecord.fields.map(field => (
                      <div key={field.key}>
                        <Text size="xs" c="dimmed">
                          {field.label}
                        </Text>
                        <Text component="div" size="sm" className="break-words">
                          <FieldValue field={field} />
                          {field.referenceLabel && (
                            <Text component="span" size="xs" c="dimmed" ml="xs">
                              ID: {field.value}
                            </Text>
                          )}
                        </Text>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <Text c="dimmed">レコードを選択してください。</Text>
            )}
          </Paper>
        </div>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          表示できるテーブルはありません。
        </Text>
      )}
    </>
  );
}
