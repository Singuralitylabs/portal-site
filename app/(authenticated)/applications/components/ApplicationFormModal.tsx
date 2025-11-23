import { useState, useEffect } from "react";
import { Modal, TextInput, Select, Textarea, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import type { ApplicationUpdateFormType, SelectCategoryType, SelectDeveloperType } from "@/app/types";
import { z } from "zod";
import { registerApplication, updateApplication } from "@/app/services/api/applications-client";

interface ApplicationFormModalProps {
  opened: boolean;
  onClose: () => void;
  categories: SelectCategoryType[];
  developers: SelectDeveloperType[];
  userId: number;
  initialData?: ApplicationUpdateFormType;
}

export function ApplicationFormModal({
  opened,
  onClose,
  categories,
  developers,
  userId,
  initialData,
}: ApplicationFormModalProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    category_id: initialData?.category_id ?? 0,
    description: initialData?.description ?? "",
    url: initialData?.url ?? "",
    thumbnail_path: initialData?.thumbnail_path ?? "",
    developer_id: initialData?.developer_id ?? 0,
    display_order: initialData?.display_order ?? null,
  });
  const router = useRouter();

  // モーダルが開かれたとき、編集時はinitialDataでformを更新
  useEffect(() => {
    setForm({
      name: initialData?.name ?? "",
      category_id: initialData?.category_id ?? 0,
      description: initialData?.description ?? "",
      url: initialData?.url ?? "",
      thumbnail_path: initialData?.thumbnail_path ?? "",
      developer_id: initialData?.developer_id ?? 0,
      display_order: initialData?.display_order ?? null,
    });
  }, [opened, initialData]);

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

    // API呼び出し(初期値あり：編集時は更新、初期値なし：新規登録)
    const result = initialData
      ? await updateApplication({ ...form, id: initialData.id, updated_by: userId })
      : await registerApplication({ ...form, created_by: userId });

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
        onChange={value => setForm(f => ({ ...f, category_id: Number(value) }))}
        required
        mb="sm"
      />
      <Select
        label="開発者"
        data={developers.map(developer => ({
          value: String(developer.id),
          label: developer.display_name,
        }))}
        value={String(form.developer_id)}
        onChange={value => setForm(f => ({ ...f, developer_id: Number(value) }))}
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
