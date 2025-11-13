import { useState, useEffect } from "react";
import { Modal, TextInput, Select, Textarea, Button, Group, NumberInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { registerVideo, updateVideo } from "@/app/services/api/videos-client";
import type { SelectCategoryType, VideoUpdateFormType } from "@/app/types";

interface VideoFormModalProps {
  opened: boolean;
  onClose: () => void;
  categories: SelectCategoryType[];
  userId: number;
  initialData?: VideoUpdateFormType;
}

export function VideoFormModal({
  opened,
  onClose,
  categories,
  userId,
  initialData,
}: VideoFormModalProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    category_id: initialData?.category_id ?? 0,
    description: initialData?.description ?? "",
    url: initialData?.url ?? "",
    thumbnail_path: initialData?.thumbnail_path ?? "",
    thumbnail_time: initialData?.thumbnail_time ?? 0,
    length: initialData?.length ?? 0,
    assignee: initialData?.assignee ?? "",
    display_order: initialData?.display_order ?? null,
  });
  const router = useRouter();

  useEffect(() => {
    setForm({
      name: initialData?.name ?? "",
      category_id: initialData?.category_id ?? 0,
      description: initialData?.description ?? "",
      url: initialData?.url ?? "",
      thumbnail_path: initialData?.thumbnail_path ?? "",
      thumbnail_time: initialData?.thumbnail_time ?? 0,
      length: initialData?.length ?? 0,
      assignee: initialData?.assignee ?? "",
      display_order: initialData?.display_order ?? null,
    });
  }, [opened, initialData]);

  const handleSubmit = async () => {
    if (!form.name || !form.url?.trim() || form.category_id === 0) {
      notifications.show({
        title: "入力エラー",
        message: "動画名とURL及びカテゴリーは必須です",
        color: "red",
      });
      return;
    }
    // URL形式チェック
    const urlValidation = /^https?:\/\/.+/.test(form.url);
    if (!urlValidation) {
      notifications.show({
        title: "入力エラー",
        message: "正しいURLを入力してください",
        color: "red",
      });
      return;
    }

    // API呼び出し(初期値あり：編集時は更新、初期値なし：新規登録)
    const result = initialData
      ? await updateVideo({ ...form, id: initialData.id, updated_by: userId })
      : await registerVideo({ ...form, created_by: userId });

    if (result?.success) {
      notifications.show({
        title: initialData ? "更新完了" : "登録完了",
        message: initialData ? "動画が正常に更新されました。" : "動画が正常に登録されました。",
        color: "green",
      });
      router.refresh();
    } else {
      notifications.show({
        title: initialData ? "更新失敗" : "登録失敗",
        message: String(result?.error?.hint) || "不明なエラー",
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
      title={initialData ? "動画編集" : "動画新規登録"}
      centered
    >
      <TextInput
        label="動画名"
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
      <Textarea
        label="説明文"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        mb="sm"
      />
      <TextInput
        label="動画URL"
        value={form.url}
        onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
        required
        mb="sm"
      />
      <TextInput
        label="サムネイル画像パス"
        value={form.thumbnail_path}
        onChange={e => setForm(f => ({ ...f, thumbnail_path: e.target.value }))}
        mb="sm"
      />
      <NumberInput
        label="サムネイルタイミング（秒）"
        value={form.thumbnail_time}
        onChange={value => setForm(f => ({ ...f, thumbnail_time: Number(value) }))}
        min={0}
        mb="sm"
      />
      <NumberInput
        label="動画の再生時間（秒）"
        value={form.length}
        onChange={value => setForm(f => ({ ...f, length: Number(value) }))}
        min={0}
        mb="sm"
      />
      <TextInput
        label="担当者"
        value={form.assignee}
        onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
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
