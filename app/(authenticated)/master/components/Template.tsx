"use client";

import { useState } from "react";
import { ActionIcon, Button, Group, Tabs, Text, Tooltip } from "@mantine/core";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { PageTitle } from "@/app/components/PageTitle";
import type { MasterManagementData } from "@/app/services/api/master-server";
import type { MasterTableName } from "@/app/constants/master";
import { MasterRecordList } from "./MasterRecordList";
import { MasterRecordDetails } from "./MasterRecordDetails";
import { MasterRecordFormModal } from "./MasterRecordFormModal";
import { MasterRecordActionModal } from "./MasterRecordActionModal";

export function MasterPageTemplate({ initialData }: { initialData: MasterManagementData }) {
  const [tableName, setTableName] = useState<MasterTableName>(
    initialData.tables[0]?.tableName ?? "documents"
  );
  const [selectedId, setSelectedId] = useState<number | null>(
    initialData.tables[0]?.records[0]?.id ?? null
  );
  const [operation, setOperation] = useState<"create" | "update" | "delete" | "restore" | null>(
    null
  );
  const table =
    initialData.tables.find(item => item.tableName === tableName) ?? initialData.tables[0];
  const record = table?.records.find(item => item.id === selectedId) ?? table?.records[0] ?? null;
  const deleted = record?.fieldMap.is_deleted?.value === true;
  const reserved = tableName === "categories" && record?.fieldMap.name?.value === "未分類";
  const leadership = tableName === "positions" && record?.fieldMap.is_leadership?.value === true;
  return (
    <>
      <PageTitle>マスター管理</PageTitle>
      {table ? (
        <Tabs
          value={table.tableName}
          onChange={value => {
            const next = initialData.tables.find(item => item.tableName === value);
            if (!next) return;
            setTableName(next.tableName);
            setSelectedId(next.records[0]?.id ?? null);
            setOperation(null);
          }}
          mt="md"
          mb="md"
        >
          <Tabs.List>
            {initialData.tables.map(item => (
              <Tabs.Tab key={item.tableName} value={item.tableName}>
                {item.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Panel value={table.tableName} pt="md">
            <Group justify="space-between" mb="sm" wrap="wrap">
              <Button
                size="sm"
                leftSection={<Plus size={16} />}
                onClick={() => setOperation("create")}
              >
                新規登録
              </Button>
              <Group gap="xs">
                <Tooltip label="編集">
                  <ActionIcon
                    variant="default"
                    size="lg"
                    aria-label="レコードを編集"
                    disabled={!record || deleted}
                    onClick={() => setOperation("update")}
                  >
                    <Pencil size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip
                  label={
                    reserved
                      ? "未分類は削除できません"
                      : leadership
                        ? "幹部役職は削除できません"
                        : "削除"
                  }
                >
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="lg"
                    aria-label="レコードを削除"
                    disabled={!record || deleted || reserved || leadership}
                    onClick={() => setOperation("delete")}
                  >
                    <Trash2 size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={tableName === "positions" ? "役職は復元対象外です" : "復元"}>
                  <ActionIcon
                    variant="light"
                    color="green"
                    size="lg"
                    aria-label="レコードを復元"
                    disabled={!record || !deleted || tableName === "positions"}
                    onClick={() => setOperation("restore")}
                  >
                    <RotateCcw size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
            <div className="grid h-[calc(100dvh-16rem)] min-h-[32rem] grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-rows-1">
              <MasterRecordList
                key={table.tableName}
                table={table}
                selectedId={record?.id ?? null}
                onSelect={setSelectedId}
              />
              <MasterRecordDetails record={record} />
            </div>
          </Tabs.Panel>
        </Tabs>
      ) : (
        <Text c="dimmed">表示できるテーブルはありません。</Text>
      )}
      {table && (operation === "create" || operation === "update") && (
        <MasterRecordFormModal
          key={`${table.tableName}:${operation}:${record?.id ?? "new"}`}
          table={table.tableName}
          label={table.label}
          record={operation === "update" ? record : null}
          onClose={() => setOperation(null)}
          onSaved={setSelectedId}
        />
      )}
      {table && record && (operation === "delete" || operation === "restore") && (
        <MasterRecordActionModal
          table={table.tableName}
          record={record}
          operation={operation}
          onClose={() => setOperation(null)}
        />
      )}
    </>
  );
}
