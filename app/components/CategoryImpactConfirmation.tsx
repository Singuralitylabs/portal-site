"use client";

import { Alert, Button, Checkbox, Group, ScrollArea, Table, Text } from "@mantine/core";
import { useState } from "react";
import type { CategoryImpact } from "@/app/utils/master-validation";

export function CategoryImpactConfirmation({
  impact,
  loading,
  onConfirm,
  onCancel,
}: {
  impact: CategoryImpact;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [acceptedToken, setAcceptedToken] = useState<string | null>(null);
  return (
    <>
      <Alert color="yellow" mb="sm" title="関連コンテンツの確認">
        {impact.contents.length}{" "}
        件のコンテンツが関連しています。削除時は同種別の未分類へ移動します。
      </Alert>
      <ScrollArea
        h={240}
        type="always"
        offsetScrollbars
        viewportProps={{ tabIndex: 0, role: "region", "aria-label": "関連コンテンツ一覧" }}
      >
        <Table miw={400}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>種別</Table.Th>
              <Table.Th>ID</Table.Th>
              <Table.Th>名称</Table.Th>
              <Table.Th>状態</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {impact.contents.map(item => (
              <Table.Tr key={`${item.table}:${item.id}`}>
                <Table.Td>
                  {{ documents: "資料", videos: "動画", applications: "アプリ" }[item.table]}
                </Table.Td>
                <Table.Td>{item.id}</Table.Td>
                <Table.Td>
                  <Text size="sm" style={{ overflowWrap: "anywhere" }}>
                    {item.name}
                  </Text>
                </Table.Td>
                <Table.Td>{item.is_deleted ? "削除済み" : "有効"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Checkbox
        mt="md"
        label="関連コンテンツを確認しました"
        checked={acceptedToken === impact.token}
        onChange={event => setAcceptedToken(event.currentTarget.checked ? impact.token : null)}
        disabled={loading}
      />
      <Group mt="md" justify="flex-end">
        <Button variant="default" onClick={onCancel} disabled={loading}>
          戻る
        </Button>
        <Button onClick={onConfirm} loading={loading} disabled={acceptedToken !== impact.token}>
          確認して実行
        </Button>
      </Group>
    </>
  );
}
