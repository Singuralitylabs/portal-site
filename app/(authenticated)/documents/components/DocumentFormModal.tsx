import { useState, useEffect } from "react";
import { Modal, TextInput, Select, Textarea, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { registerDocument, updateDocument } from "@/app/services/api/documents-client";
import type { DocumentWithCategoryType, SelectCategoryType } from "@/app/types";
import { useDisplayOrderForm } from "@/app/hooks/useDisplayOrderForm";
import { isValidUrl } from "@/app/services/api/validation";
import { createClientSupabaseClient } from "@/app/services/api/supabase-client";

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
  const supabase = createClientSupabaseClient();
  const [form, setForm] = useState({
    name: "",
    category_id: 0,
    description: "",
    url: "",
    assignee: null as string | null,
  });
  const [users, setUsers] = useState<{ id: number; display_name: string }[]>([]);
  const router = useRouter();

  // 表示順操作フック
  const { position, setPosition, positionOptions, parsePosition, handleCategoryChange } =
    useDisplayOrderForm("documents", form.category_id, initialData?.id, !!initialData);

  // 責任者リストを取得するエフェクト
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, display_name")
        .order("display_name");
      if (data) setUsers(data);
    };
    fetchUsers();
  }, [supabase]);

  // モーダルが開かれたときの初期化処理
  useEffect(() => {
    setForm({
      name: initialData?.name ?? "",
      category_id: initialData?.category_id ?? 0,
      description: initialData?.description ?? "",
      url: initialData?.url ?? "",
      assignee: initialData?.assignee ?? null,
    });
    setPosition(initialData ? "current" : "last");
  }, [opened, initialData, setPosition]);

  const handleCategoryChangeWrapper = async (value: string | null) => {
    const categoryId = Number(value);
    setForm(f => ({ ...f, category_id: categoryId }));
    await handleCategoryChange(categoryId);
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

    // URLの形式チェック_validation.tsの共通関数に再修正_https://のみ許容
    if (!isValidUrl(form.url)) {
      notifications.show({
        title: "入力エラー",
        message: "URLは https:// から始まる正しい形式で入力してください",
        color: "red",
      });
      return;
    }

    const parsedPosition = parsePosition(position);

    const commonData = {
      name: form.name,
      category_id: form.category_id,
      description: form.description,
      url: form.url,
      assignee: form.assignee,
      position: parsedPosition,
    };

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
      onClose();
    } else {
      notifications.show({
        title: initialData ? "更新失敗" : "登録失敗",
        message: String(result?.error) || "不明なエラー",
        color: "red",
      });
    }
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
        onChange={handleCategoryChangeWrapper}
        required
        mb="sm"
      />
      <Textarea
        label="説明文"
        value={form.description}
        placeholder="文字数は70文字以内にしてください。"
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        rows={5}
        mb="sm"
      />
      <TextInput
        label="資料URL"
        value={form.url}
        onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
        required
        mb="sm"
      />
      {/* TextInputからSelectに変更 */}
      <Select
        label="責任者"
        placeholder="責任者を選択してください"
        data={users.map(user => ({
          value: String(user.id),
          label: user.display_name,
        }))}
        value={form.assignee ? String(form.assignee) : ""}
        onChange={value => setForm(f => ({ ...f, assignee: value }))}
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
