"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Group, Modal, Select, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { CategoryImpactConfirmation } from "@/app/components/CategoryImpactConfirmation";
import type { CategoryImpact } from "@/app/utils/master-validation";
import {
  getCategoriesForPosition,
  registerCategory,
  updateCategory,
} from "@/app/services/api/categories-client";
import type {
  CategoryManagementItemType,
  CategoryTypeValue,
  PlacementPositionType,
} from "@/app/types";

const CATEGORY_TYPE_OPTIONS: { value: CategoryTypeValue; label: string }[] = [
  { value: "documents", label: "資料" },
  { value: "videos", label: "動画" },
  { value: "applications", label: "アプリ" },
];

interface CategoryFormModalProps {
  opened: boolean;
  onClose: () => void;
  initialData?: CategoryManagementItemType;
  defaultType: CategoryTypeValue;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return "不明なエラー";
}

function parsePosition(position: string): PlacementPositionType {
  if (position === "current") return { type: "current" };
  if (position === "first") return { type: "first" };
  if (position === "last") return { type: "last" };
  if (position.startsWith("after:")) {
    return { type: "after", afterId: Number(position.split(":")[1]) };
  }

  return { type: "last" };
}

export function CategoryFormModal({
  opened,
  onClose,
  initialData,
  defaultType,
}: CategoryFormModalProps) {
  const [categoryType, setCategoryType] = useState<CategoryTypeValue>(defaultType);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState<string>("last");
  const [impact, setImpact] = useState<CategoryImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<
    { id: number; name: string; display_order: number }[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    if (!opened) return;

    const type = (initialData?.category_type as CategoryTypeValue | undefined) ?? defaultType;
    setCategoryType(type);
    setName(initialData?.name ?? "");
    setDescription(initialData?.description ?? "");
    setPosition(initialData ? "current" : "last");
    setImpact(null);
  }, [opened, initialData, defaultType]);

  useEffect(() => {
    if (!opened) return;

    let active = true;
    getCategoriesForPosition(categoryType, initialData?.id)
      .then(data => {
        if (active) setCategories(data);
      })
      .catch(() => {
        if (active)
          notifications.show({
            title: "取得失敗",
            message: "表示順の選択肢を取得できませんでした。",
            color: "red",
          });
      });
    return () => {
      active = false;
    };
  }, [opened, categoryType, initialData?.id]);

  const positionOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];

    if (initialData) {
      options.push({ value: "current", label: "現在の位置を維持" });
    }

    options.push({ value: "first", label: "最初に配置" });

    for (const category of categories) {
      options.push({
        value: `after:${category.id}`,
        label: `${category.display_order}. ${category.name}の後に配置`,
      });
    }

    options.push({ value: "last", label: "最後に配置" });

    return options;
  }, [categories, initialData]);

  const handleSubmit = async (confirmationToken?: string) => {
    if (loading) return;
    if (!name.trim()) {
      notifications.show({
        title: "入力エラー",
        message: "カテゴリー名は必須です。",
        color: "red",
      });
      return;
    }

    setLoading(true);
    try {
      const result = initialData
        ? await updateCategory(
            {
              id: initialData.id,
              category_type: categoryType,
              name: name.trim(),
              description: description.trim() || null,
              position: parsePosition(position),
            },
            confirmationToken
          )
        : await registerCategory({
            category_type: categoryType,
            name: name.trim(),
            description: description.trim() || null,
            position: parsePosition(position),
          });

      if (!result.success) {
        if (result.confirmation) {
          setImpact(result.confirmation);
          return;
        }
        notifications.show({
          title: initialData ? "更新失敗" : "登録失敗",
          message: getErrorMessage(result.error),
          color: "red",
        });
        return;
      }

      notifications.show({
        title: initialData ? "更新完了" : "登録完了",
        message: initialData ? "カテゴリーを更新しました。" : "カテゴリーを登録しました。",
        color: "green",
      });

      onClose();
      router.refresh();
    } catch {
      notifications.show({
        title: "保存失敗",
        message: "通信に失敗しました。再試行してください。",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialData ? "カテゴリー編集" : "カテゴリー新規登録"}
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
    >
      {impact ? (
        <CategoryImpactConfirmation
          impact={impact}
          loading={loading}
          onConfirm={() => void handleSubmit(impact.token)}
          onCancel={() => setImpact(null)}
        />
      ) : (
        <>
          <Select
            label="カテゴリー種別"
            data={CATEGORY_TYPE_OPTIONS}
            value={categoryType}
            onChange={value => {
              if (!value) return;
              setCategoryType(value as CategoryTypeValue);
              const shouldKeepCurrent = initialData && value === initialData.category_type;
              setPosition(shouldKeepCurrent ? "current" : "last");
            }}
            mb="sm"
            required
            disabled={loading || initialData?.name === "未分類"}
          />

          <TextInput
            label="カテゴリー名"
            value={name}
            onChange={event => setName(event.target.value)}
            mb="sm"
            required
            disabled={loading || initialData?.name === "未分類"}
          />

          <Textarea
            label="説明文"
            value={description}
            onChange={event => setDescription(event.target.value)}
            rows={4}
            mb="sm"
          />

          <Select
            label="表示順"
            data={positionOptions}
            value={position}
            onChange={value => setPosition(value ?? "last")}
            mb="sm"
          />

          <Group mt="md" justify="flex-end">
            <Button variant="default" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={() => void handleSubmit()} loading={loading}>
              {initialData ? "更新" : "登録"}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
