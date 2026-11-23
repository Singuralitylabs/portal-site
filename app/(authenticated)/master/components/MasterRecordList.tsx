"use client";

import { useRef } from "react";
import { Badge, Group, Paper, ScrollArea, Table, Text } from "@mantine/core";
import type { MasterTableData } from "@/app/services/api/master-server";
import { MasterFieldValue } from "./MasterRecordDetails";

export function MasterRecordList({
  table,
  selectedId,
  onSelect,
}: {
  table: MasterTableData;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const rows = useRef<Record<number, HTMLTableRowElement | null>>({});
  function onKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>, index: number) {
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? table.records.length - 1
          : event.key === "ArrowUp"
            ? Math.max(index - 1, 0)
            : event.key === "ArrowDown"
              ? Math.min(index + 1, table.records.length - 1)
              : ["Enter", " "].includes(event.key)
                ? index
                : null;
    if (next === null) return;
    event.preventDefault();
    const id = table.records[next].id;
    onSelect(id);
    rows.current[id]?.focus();
    rows.current[id]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  return (
    <Paper withBorder display="flex" className="min-h-0 min-w-0 flex-col overflow-hidden">
      <Group justify="space-between" p="md" pb="xs">
        <Text fw={700}>{table.label}</Text>
        <Badge variant="light">件数: {table.records.length}</Badge>
      </Group>
      {table.records.length ? (
        <ScrollArea
          h={0}
          style={{ flex: 1 }}
          type="always"
          offsetScrollbars
          viewportProps={{
            "aria-label": `${table.label}一覧`,
            style: { height: "100%", overscrollBehavior: "contain", touchAction: "pan-x pan-y" },
          }}
        >
          <Table highlightOnHover verticalSpacing="sm" miw={720}>
            <caption className="sr-only">
              {table.label}の一覧です。上下キーで行を移動し、EnterまたはSpaceで詳細を選択できます。
            </caption>
            <Table.Thead>
              <Table.Tr>
                {table.listColumnKeys.map(key => (
                  <Table.Th key={key} scope="col">
                    {table.records[0].fieldMap[key]?.label ?? key}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.records.map((record, index) => (
                <Table.Tr
                  key={record.id}
                  ref={node => {
                    rows.current[record.id] = node;
                  }}
                  bg={selectedId === record.id ? "var(--mantine-color-blue-0)" : undefined}
                  className="cursor-pointer"
                  onClick={() => onSelect(record.id)}
                  onKeyDown={event => onKeyDown(event, index)}
                  tabIndex={selectedId === record.id ? 0 : -1}
                  aria-current={selectedId === record.id ? "true" : undefined}
                >
                  {table.listColumnKeys.map(key => (
                    <Table.Td key={key} maw={260} className="truncate">
                      {record.fieldMap[key] ? (
                        <MasterFieldValue field={record.fieldMap[key]} />
                      ) : (
                        "-"
                      )}
                    </Table.Td>
                  ))}
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
  );
}
