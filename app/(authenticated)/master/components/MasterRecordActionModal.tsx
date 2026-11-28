"use client";

import { useState } from "react";
import { Alert, Button, Group, Modal, Text } from "@mantine/core";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MasterTableName } from "@/app/constants/master";
import type { MasterRecord } from "@/app/services/api/master-server";
import { mutateMasterRecordAction } from "@/app/services/api/master-actions";
import type { CategoryImpact } from "@/app/utils/master-validation";
import { CategoryImpactConfirmation } from "@/app/components/CategoryImpactConfirmation";

export function MasterRecordActionModal({
  table,
  record,
  operation,
  onClose,
}: {
  table: MasterTableName;
  record: MasterRecord;
  operation: "delete" | "restore";
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impact, setImpact] = useState<CategoryImpact | null>(null);
  const router = useRouter();
  async function submit(token?: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await mutateMasterRecordAction({
        table,
        operation,
        id: record.id,
        confirmationToken: token,
      });
      if (!result.success) {
        setError(result.error?.message ?? "操作に失敗しました。");
        setImpact(result.confirmation ?? null);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("通信に失敗しました。再試行してください。");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal
      opened
      onClose={onClose}
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
      title={operation === "delete" ? "削除の確認" : "復元の確認"}
      size="lg"
      centered
    >
      {error && (
        <Alert color="red" mb="sm" role="alert">
          {error}
        </Alert>
      )}
      {impact ? (
        <CategoryImpactConfirmation
          impact={impact}
          loading={loading}
          onConfirm={() => void submit(impact.token)}
          onCancel={() => {
            setImpact(null);
            setError(null);
          }}
        />
      ) : (
        <>
          <Text style={{ overflowWrap: "anywhere" }}>
            「{String(record.fieldMap.name?.value ?? record.id)}」を
            {operation === "delete" ? "削除" : "復元"}しますか？
          </Text>
          <Group mt="md" justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={loading}>
              キャンセル
            </Button>
            <Button
              color={operation === "delete" ? "red" : undefined}
              leftSection={operation === "delete" ? <Trash2 size={16} /> : <RotateCcw size={16} />}
              onClick={() => void submit()}
              loading={loading}
            >
              {operation === "delete" ? "削除" : "復元"}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
