"use client";

import { Badge, Paper, ScrollArea, Text } from "@mantine/core";
import type { MasterRecord, MasterRecordField } from "@/app/services/api/master-server";

const formatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

export function MasterFieldValue({ field }: { field: MasterRecordField }) {
  if (field.key === "is_deleted" && typeof field.value === "boolean") {
    return (
      <Badge color={field.value ? "red" : "green"} variant="light">
        {field.value ? "削除済み" : "有効"}
      </Badge>
    );
  }
  let value =
    field.referenceLabel ??
    (field.value === null
      ? "-"
      : typeof field.value === "boolean"
        ? field.value
          ? "はい"
          : "いいえ"
        : String(field.value));
  if (!field.referenceLabel && field.key.endsWith("_at") && typeof field.value === "string") {
    const date = new Date(
      /(?:Z|[+-]\d{2}:\d{2})$/.test(field.value) ? field.value : `${field.value}Z`
    );
    if (!Number.isNaN(date.getTime())) value = formatter.format(date);
  }
  return <>{value}</>;
}

export function MasterRecordDetails({ record }: { record: MasterRecord | null }) {
  return (
    <Paper withBorder p="md" display="flex" className="min-h-0 min-w-0 flex-col overflow-hidden">
      <Text fw={700} mb="xs" style={{ overflowWrap: "anywhere" }}>
        {String(record?.fieldMap.name?.value ?? "詳細")}
      </Text>
      {record ? (
        <ScrollArea
          h={0}
          style={{ flex: 1 }}
          type="always"
          offsetScrollbars
          viewportProps={{
            tabIndex: 0,
            "aria-label": "レコード詳細",
            style: { height: "100%", overscrollBehavior: "contain", touchAction: "pan-x pan-y" },
          }}
        >
          <div className="space-y-3 pr-1">
            {record.fields.map(field => (
              <div key={field.key}>
                <Text size="xs" c="dimmed">
                  {field.label}
                </Text>
                <Text component="div" size="sm" style={{ overflowWrap: "anywhere" }}>
                  <MasterFieldValue field={field} />
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
      ) : (
        <Text c="dimmed">レコードを選択してください。</Text>
      )}
    </Paper>
  );
}
