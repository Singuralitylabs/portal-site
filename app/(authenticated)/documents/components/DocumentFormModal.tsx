import { useState, useEffect, useMemo } from "react";
import { Modal, TextInput, Select, Textarea, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import {
  registerDocument,
  updateDocument,
  getDocumentsByCategory,
} from "@/app/services/api/documents-client";
import type {
  DocumentWithCategoryType,
  SelectCategoryType,
  PlacementPositionType,
} from "@/app/types";
import { z } from "zod";

interface DocumentFormModalProps {
  opened: boolean;
  onClose: () => void;
  categories: SelectCategoryType[];
  userId: number;
  initialData?: DocumentWithCategoryType;
}

export function DocumentFormModal({
  opened,
  onClose,
  categories,
  userId,
  initialData,
}: DocumentFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    category_id: 0,
    description: "",
    url: "",
    assignee: "",
    position: "last",
  });
  const [documents, setDocuments] = useState<
    { id: number; name: string; display_order: number | null }[]
  >([]);
  const router = useRouter();

  // モーダルが開かれたときの初期化処理
  useEffect(() => {
    // フォームを初期化
    setForm({
      name: initialData?.name ?? "",
      category_id: initialData?.category_id ?? 0,
      description: initialData?.description ?? "",
      url: initialData?.url ?? "",
      assignee: initialData?.assignee ?? "",
      position: initialData ? "current" : "last",
    });

    // 資料一覧を取得（編集時のみ）
    if (initialData?.category_id) {
      getDocumentsByCategory(initialData.category_id, initialData.id).then(setDocuments);
    } else {
      setDocuments([]);
    }
  }, [opened, initialData]);

  // カテゴリー変更時に資料一覧を取得
  const handleCategoryChange = async (value: string | null) => {
    const categoryId = Number(value);
    setForm(f => ({ ...f, category_id: categoryId }));

    if (categoryId > 0) {
      const docs = await getDocumentsByCategory(categoryId, initialData?.id);
      setDocuments(docs);
    } else {
      setDocuments([]);
    }
  };

  // 位置選択肢を構築（メモ化して不要な再計算を防ぐ）
  const positionOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];

    // 編集時のみ「現在の位置を維持」を追加
    if (initialData) {
      options.push({ value: "current", label: "現在の位置を維持" });
    }

    // 「最初に配置」
    options.push({ value: "first", label: "最初に配置" });

    // 既存資料の後に配置
    documents.forEach(doc => {
      options.push({
        value: `after:${doc.id}`,
        label: `「${doc.name}」の後に配置`,
      });
    });

    // 「最後に配置」
    options.push({ value: "last", label: "最後に配置" });

    return options;
  }, [documents, initialData]);

  // 選択値をPlacementPositionTypeに変換
  const parsePosition = (value: string): PlacementPositionType => {
    if (value === "current") return { type: "current" };
    if (value === "first") return { type: "first" };
    if (value === "last") return { type: "last" };
    if (value.startsWith("after:")) {
      const afterId = Number(value.split(":")[1]);
      return { type: "after", afterId };
    }
    return { type: "last" }; // フォールバック
  };

  const handleSubmit = async () => {
    if (!form.name || !form.url?.trim() || form.category_id === 0) {
      notifications.show({
        title: "入力エラー",
        message: "資料名とURL及びカテゴリーは必須です",
        color: "red",
      });
      return;
    }
    // URLの形式チェック
    const httpUrl = z.url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
    });
    const urlValidation = httpUrl.safeParse(form.url);
    if (!urlValidation.success) {
      notifications.show({
        title: "入力エラー",
        message: urlValidation.error?.message || "正しいURLを入力してください",
        color: "red",
      });
      return;
    }

    // positionをPlacementPositionに変換
    const position = parsePosition(form.position);

    // 共通のフィールドをまとめる
    const commonData = {
      name: form.name,
      category_id: form.category_id,
      description: form.description,
      url: form.url,
      assignee: form.assignee,
      position,
    };

    // API呼び出し(編集時は更新、新規時は登録)
    const result = initialData
      ? await updateDocument({ id: initialData.id, updated_by: userId, ...commonData })
      : await registerDocument({ created_by: userId, ...commonData });

    if (result?.success) {
      notifications.show({
        title: initialData ? "更新完了" : "登録完了",
        message: initialData ? "資料が正常に更新されました。" : "資料が正常に登録されました。",
        color: "green",
      });
      router.refresh();
    } else {
      notifications.show({
        title: initialData ? "更新失敗" : "登録失敗",
        message: String(result?.error) || "不明なエラー",
        color: "red",
      });
      return;
    }
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialData ? "資料編集" : "資料新規登録"}
      centered
    >
      <TextInput
        label="資料名"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        required
        mb="sm"
      />
      <Select
        label="カテゴリー"
        data={categories.map(category => ({
          value: String(category.id),
          label: category.name,
        }))}
        value={String(form.category_id)}
        onChange={handleCategoryChange}
        required
        mb="sm"
      />
      <Textarea
        label="説明文"
        value={form.description}
        placeholder="文字数は70文字以内にしてください。"
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        mb="sm"
      />
      <TextInput
        label="資料URL"
        value={form.url}
        onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
        required
        mb="sm"
      />
      <TextInput
        label="担当者"
        value={form.assignee}
        onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
        mb="sm"
      />
      <Select
        label="表示順"
        data={positionOptions}
        value={form.position}
        onChange={value => setForm(f => ({ ...f, position: value || "last" }))}
        placeholder="配置位置を選択"
        mb="sm"
      />
      <Group mt="md" justify="flex-end">
        <Button variant="default" onClick={onClose}>
          キャンセル
        </Button>
        <Button color="blue" onClick={handleSubmit}>
          {initialData ? "更新" : "登録"}
        </Button>
      </Group>
    </Modal>
  );
}
