"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MasterRecord } from "@/app/services/api/master-server";
import type { MasterFormOptions } from "@/app/services/api/master-mutations-server";
import type { MasterTableName } from "@/app/constants/master";
import {
  fetchMasterFormOptionsAction,
  mutateMasterRecordAction,
} from "@/app/services/api/master-actions";
import type { CategoryImpact, MasterMutationInput } from "@/app/utils/master-validation";
import { CategoryImpactConfirmation } from "@/app/components/CategoryImpactConfirmation";

const categoryTypes = [
  { value: "documents", label: "資料" },
  { value: "videos", label: "動画" },
  { value: "applications", label: "アプリ" },
];

export function MasterRecordFormModal({
  table,
  label,
  record,
  onClose,
  onSaved,
}: {
  table: MasterTableName;
  label: string;
  record: MasterRecord | null;
  onClose: () => void;
  onSaved: (id: number) => void;
}) {
  const [values, setValues] = useState<NonNullable<MasterMutationInput["fields"]>>(() => {
    const keys = [
      "name",
      "description",
      ...(table === "categories"
        ? ["category_type"]
        : table === "positions"
          ? ["is_leadership"]
          : ["url", "category_id", table === "applications" ? "developer_id" : "assignee_id"]),
      ...(table === "videos"
        ? ["thumbnail_path", "thumbnail_time", "length"]
        : table === "applications"
          ? ["thumbnail_path"]
          : []),
    ];
    return Object.fromEntries(
      keys.map(key => [
        key,
        record?.fieldMap[key]?.value ??
          (key === "category_type"
            ? "documents"
            : key === "is_leadership"
              ? false
              : key.endsWith("_id") || ["length", "thumbnail_time"].includes(key)
                ? null
                : ""),
      ])
    );
  });
  const [options, setOptions] = useState<MasterFormOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState<CategoryImpact | null>(null);
  const [position, setPosition] = useState(record ? "current" : "last");
  const router = useRouter();
  useEffect(() => {
    let active = true;
    fetchMasterFormOptionsAction(table, record?.id)
      .then(result => {
        if (!active) return;
        setOptions(result.options);
        setError(result.error);
      })
      .catch(() => {
        if (active) setError("選択肢の取得に失敗しました。");
      });
    return () => {
      active = false;
    };
  }, [table, record?.id]);
  function setField(key: string, value: string | number | boolean | null) {
    setValues(current => ({ ...current, [key]: value }));
    setImpact(null);
    if (key === "category_id" || key === "category_type") setPosition("last");
  }
  const groupKey =
    table === "categories" ? "category_type" : table === "positions" ? null : "category_id";
  const groupUnchanged =
    record && (!groupKey || values[groupKey] === record.fieldMap[groupKey]?.value);
  const placements = [
    ...(groupUnchanged ? [{ value: "current", label: "現在の位置を維持" }] : []),
    { value: "first", label: "最初に配置" },
    ...(options?.records ?? [])
      .filter(item => item.id !== record?.id && (!groupKey || item[groupKey] === values[groupKey]))
      .sort((left, right) => left.display_order - right.display_order || left.id - right.id)
      .map(item => ({
        value: `after:${item.id}`,
        label: `${item.display_order}. ${item.name} の後`,
      })),
    { value: "last", label: "最後に配置" },
  ];
  async function submit(token?: string) {
    if (loading || !options) return;
    setLoading(true);
    setError(null);
    try {
      const result = await mutateMasterRecordAction({
        table,
        operation: record ? "update" : "create",
        id: record?.id,
        fields: values,
        position: position.startsWith("after:")
          ? { type: "after", afterId: Number(position.slice(6)) }
          : { type: position as "current" | "first" | "last" },
        confirmationToken: token,
      });
      if (!result.success) {
        setImpact(result.confirmation ?? null);
        setError(result.error?.message ?? "保存に失敗しました。");
        return;
      }
      if (result.id !== undefined) onSaved(result.id);
      router.refresh();
      onClose();
    } catch {
      setError("通信に失敗しました。再試行してください。");
    } finally {
      setLoading(false);
    }
  }
  const reserved = table === "categories" && record?.fieldMap.name?.value === "未分類";
  return (
    <Modal
      opened
      onClose={onClose}
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
      title={`${label}${record ? "編集" : "新規登録"}`}
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
          onCancel={() => {
            setImpact(null);
            setError(null);
          }}
          onConfirm={() => void submit(impact.token)}
        />
      ) : !options ? (
        <Loader aria-label="選択肢を取得中" />
      ) : (
        <form
          onSubmit={event => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset disabled={loading} className="min-w-0 border-0 p-0">
            <Stack gap="sm">
              <TextInput
                label="名称"
                required
                maxLength={table === "positions" ? 50 : table === "categories" ? 100 : 255}
                value={String(values.name)}
                onChange={event => setField("name", event.currentTarget.value)}
                disabled={reserved}
              />
              <Textarea
                label="説明"
                value={String(values.description ?? "")}
                onChange={event => setField("description", event.currentTarget.value)}
                autosize
                minRows={3}
                maxRows={8}
              />
              {table === "categories" && (
                <Select
                  label="カテゴリー種別"
                  required
                  data={categoryTypes}
                  value={String(values.category_type)}
                  onChange={value => {
                    if (value) setField("category_type", value);
                  }}
                  disabled={reserved}
                />
              )}
              {table === "positions" && (
                <Checkbox
                  label="幹部"
                  checked={values.is_leadership === true}
                  onChange={event => setField("is_leadership", event.currentTarget.checked)}
                  disabled={options.positionReferenced}
                  description={
                    options.positionReferenced
                      ? "使用中の役職の幹部フラグは変更できません。"
                      : undefined
                  }
                />
              )}
              {table !== "categories" && table !== "positions" && (
                <>
                  <TextInput
                    label="URL"
                    type="url"
                    required
                    value={String(values.url ?? "")}
                    onChange={event => setField("url", event.currentTarget.value)}
                  />
                  <Select
                    label="カテゴリー"
                    required
                    searchable
                    data={options.categories
                      .filter(category => category.category_type === table)
                      .map(category => ({
                        value: String(category.id),
                        label: `${category.name} (${category.id})`,
                      }))}
                    value={values.category_id === null ? null : String(values.category_id)}
                    onChange={value => setField("category_id", value ? Number(value) : null)}
                  />
                  <Select
                    label={table === "applications" ? "開発者" : "担当者"}
                    searchable
                    clearable
                    data={options.members.map(member => ({
                      value: String(member.id),
                      label: `${member.display_name} (${member.id})`,
                    }))}
                    value={
                      values[table === "applications" ? "developer_id" : "assignee_id"] === null
                        ? null
                        : String(values[table === "applications" ? "developer_id" : "assignee_id"])
                    }
                    onChange={value =>
                      setField(
                        table === "applications" ? "developer_id" : "assignee_id",
                        value ? Number(value) : null
                      )
                    }
                  />
                </>
              )}
              {(table === "videos" || table === "applications") && (
                <TextInput
                  label="サムネイルパス"
                  value={String(values.thumbnail_path ?? "")}
                  onChange={event => setField("thumbnail_path", event.currentTarget.value || null)}
                />
              )}
              {table === "videos" && (
                <>
                  {(
                    [
                      ["thumbnail_time", "サムネイル位置（秒）"],
                      ["length", "再生時間（秒）"],
                    ] as const
                  ).map(([key, fieldLabel]) => (
                    <NumberInput
                      key={key}
                      label={fieldLabel}
                      min={0}
                      allowDecimal={false}
                      value={values[key] === null ? "" : Number(values[key])}
                      onChange={value => setField(key, value === "" ? null : Number(value))}
                    />
                  ))}
                </>
              )}
              <Select
                label="表示順"
                required
                searchable
                data={placements}
                value={position}
                onChange={value => setPosition(value ?? "last")}
              />
              <Group justify="flex-end" mt="sm">
                <Button variant="default" onClick={onClose}>
                  キャンセル
                </Button>
                <Button type="submit" leftSection={<Save size={16} />} loading={loading}>
                  保存
                </Button>
              </Group>
            </Stack>
          </fieldset>
        </form>
      )}
    </Modal>
  );
}
