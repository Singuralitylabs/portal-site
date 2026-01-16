import { useState, useEffect } from "react";
import { Modal, TextInput, Select, Textarea, Button, Group, NumberInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { registerVideo, updateVideo } from "@/app/services/api/videos-client";
import type { VideoWithCategoryType, SelectCategoryType } from "@/app/types";
import { useDisplayOrderForm } from "@/app/hooks/useDisplayOrderForm";

interface VideoFormModalProps {
  opened: boolean;
  onClose: () => void;
  categories: SelectCategoryType[];
  userId: number;
  initialData?: VideoWithCategoryType;
}

export function VideoFormModal({
  opened,
  onClose,
  categories,
  userId,
  initialData,
}: VideoFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    category_id: 0,
    description: "",
    url: "",
    thumbnail_path: "",
    thumbnail_time: 0,
    length: 0,
    assignee: "",
  });
  const router = useRouter();

  // 表示順操作フック
  const { position, setPosition, positionOptions, parsePosition, handleCategoryChange } =
    useDisplayOrderForm("videos", form.category_id, initialData?.id, !!initialData);

  // モーダルが開かれたときの初期化処理
  useEffect(() => {
    // フォームを初期化
    setForm({
      name: initialData?.name ?? "",
      category_id: initialData?.category_id ?? 0,
      description: initialData?.description ?? "",
      url: initialData?.url ?? "",
      thumbnail_path: initialData?.thumbnail_path ?? "",
      thumbnail_time: initialData?.thumbnail_time ?? 0,
      length: initialData?.length ?? 0,
      assignee: initialData?.assignee ?? "",
    });

    // 表示順の初期化
    setPosition(initialData ? "current" : "last");
  }, [opened, initialData, setPosition]);

  // カテゴリー変更時の処理
  const handleCategoryChangeWrapper = async (value: string | null) => {
    const categoryId = Number(value);
    setForm(f => ({ ...f, category_id: categoryId }));
    await handleCategoryChange(categoryId);
  };

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

    // positionをPlacementPositionに変換
    const parsedPosition = parsePosition(position);

    // 共通のフィールドをまとめる
    const commonData = {
      name: form.name,
      category_id: form.category_id,
      description: form.description,
      url: form.url,
      thumbnail_path: form.thumbnail_path,
      thumbnail_time: form.thumbnail_time,
      length: form.length,
      assignee: form.assignee,
      position: parsedPosition,
    };

    // API呼び出し(編集時は更新、新規時は登録)
    const result = initialData
      ? await updateVideo({ id: initialData.id, updated_by: userId, ...commonData })
      : await registerVideo({ created_by: userId, ...commonData });

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
        onChange={handleCategoryChangeWrapper}
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
      <Select
        label="表示順"
        data={positionOptions}
        value={position}
        onChange={value => setPosition(value || "last")}
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
