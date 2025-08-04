import { Modal, TextInput, Select, Textarea, Group, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CategoryType } from '@/app/types';

export interface FormType {
    name: string;
    categoryId: number; // 未設定は0
    description: string;
    url: string;
    assignee: string;
}

interface Props {
    opened: boolean;
    onClose: () => void;
    categories: CategoryType[];
    onSubmit: (form: FormType) => Promise<boolean>;
    form: FormType;
    setForm: React.Dispatch<React.SetStateAction<FormType>>;
}

export function DocumentFormModal({ opened, onClose, categories, onSubmit, form, setForm }: Props) {
    const handleSubmit = async () => {
        // URLバリデーション
        if (!form.url || form.url.trim() === "") {
            notifications.show({
                title: '入力エラー',
                message: 'URLを入力してください',
                color: 'red',
            });
            return;
        }
        // 不正なURLの場合はポップアップで通知
        try {
            new URL(form.url);
        } catch {
            notifications.show({
                title: '入力エラー',
                message: '正しいURLを入力してください',
                color: 'red',
            });
            return;
        }

        const result = await onSubmit(form);
        // onSubmitが成功した場合のみフォームをリセット
        if (result) {
            setForm({ name: '', categoryId: 0, description: '', url: '', assignee: '' });
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="資料新規登録" centered>
            <TextInput
                label="資料名"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                mb="sm"
            />
            <Select
                label="カテゴリー"
                data={categories.map((cat) => ({
                    value: String(cat.id), // valueはID
                    label: cat.name        // 画面に表示されるのは名称
                }))}
                value={form.categoryId ? String(form.categoryId) : ''}
                onChange={(value) => setForm((f) => ({ ...f, categoryId: Number(value) }))}
                required
                mb="sm"
            />
            <Textarea
                label="説明文"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                mb="sm"
            />
            <TextInput
                label="資料URL"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                required
                mb="sm"
            />
            <TextInput
                label="担当者"
                value={form.assignee}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                mb="sm"
            />
            <Group mt="md" justify="flex-end">
                <Button variant="default" onClick={onClose}>キャンセル</Button>
                <Button color="blue" onClick={handleSubmit}>登録</Button>
            </Group>
        </Modal>
    );
}