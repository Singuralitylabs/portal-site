"use client";

import { useMemo, useState } from "react";
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

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

  if (field.key.endsWith("_at") && typeof field.value === "string") {
    return formatDateTime(field.value);
  }

  return String(field.value);
}

function DeletedBadge({ field }: { field: MasterRecordField }) {
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
  const nameField = record.fields.find(field => field.key === "name");
  const formattedName = nameField ? formatFieldValue(nameField) : "";
  return formattedName !== "-" ? formattedName : `ID: ${record.id}`;
}

export function MasterPageTemplate({ initialData }: MasterPageTemplateProps) {
  const [activeTableName, setActiveTableName] = useState<MasterTableName>(
    initialData.tables[0]?.tableName ?? "documents"
  );
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(
    initialData.tables[0]?.records[0]?.id ?? null
  );

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

    return activeTable.listColumnKeys
      .map(key => activeTable.records[0].fields.find(field => field.key === key))
      .filter((field): field is MasterRecordField => Boolean(field));
  }, [activeTable]);

  const handleTableChange = (value: string | null) => {
    const nextTableName = (value as MasterTableName | null) ?? "documents";
    const nextTable = initialData.tables.find(table => table.tableName === nextTableName);
    setActiveTableName(nextTableName);
    setSelectedRecordId(nextTable?.records[0]?.id ?? null);
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
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
          <Paper withBorder>
            <Group justify="space-between" p="md" pb="xs">
              <Text fw={700}>{activeTable.label}</Text>
              <Badge variant="light">件数: {activeTable.records.length}</Badge>
            </Group>

            {activeTable.records.length > 0 ? (
              <ScrollArea>
                <Table highlightOnHover verticalSpacing="sm" miw={720}>
                  <Table.Thead>
                    <Table.Tr>
                      {listFields.map(field => (
                        <Table.Th key={field.key}>{field.label}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {activeTable.records.map(record => (
                      <Table.Tr
                        key={record.id}
                        bg={
                          selectedRecord?.id === record.id
                            ? "var(--mantine-color-blue-0)"
                            : undefined
                        }
                        className="cursor-pointer"
                        onClick={() => setSelectedRecordId(record.id)}
                      >
                        {activeTable.listColumnKeys.map(key => {
                          const field = record.fields.find(item => item.key === key);
                          return (
                            <Table.Td key={key} maw={260} className="truncate">
                              {field ? <DeletedBadge field={field} /> : "-"}
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

          <Paper withBorder p="md">
            {selectedRecord ? (
              <>
                <Text fw={700} mb="xs">
                  {getRecordTitle(selectedRecord)}
                </Text>
                <div className="space-y-3">
                  {selectedRecord.fields.map(field => (
                    <div key={field.key}>
                      <Text size="xs" c="dimmed">
                        {field.label}
                      </Text>
                      <Text size="sm" className="break-words">
                        <DeletedBadge field={field} />
                        {field.referenceLabel && (
                          <Text component="span" size="xs" c="dimmed" ml="xs">
                            ID: {field.value}
                          </Text>
                        )}
                      </Text>
                    </div>
                  ))}
                </div>
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
