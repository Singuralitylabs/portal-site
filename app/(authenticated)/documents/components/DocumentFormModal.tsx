import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { registerDocument } from '@/app/services/api/documents-client';
import type { CategoryType } from '@/app/types';

interface DocumentFormModalProps {
    opened: boolean;
    onClose: () => void;
    categories: CategoryType[];
    userId: number;
}

export function DocumentFormModal({ opened, onClose, categories, userId }: DocumentFormModalProps) {
    const [form, setForm] = useState({
        name: '',
        caegory_id: 0,
        description: '',
        url: '',
        assignee: '',
    });

    const handleSubmit = async () => {
        if (!form.name || !form.url || form.caegory_id === 0 || form.url.trim() === "") {
            notifications.show({
                title: '入力エラー',
                message: '資料名とURL及びカテゴリーは必須です',
                color: 'red',
            });
            return;
        }
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

        const result = await registerDocument({
            name: form.name,
            category_id: form.caegory_id,
            description: form.description,
            url: form.url,
            assignee: form.assignee,
            created_by: userId, // 作成者のユーザーIDを設定
        });

        if (result?.success) {
            notifications.show({
                title: '登録完了',
                message: '資料が正常に登録されました。',
                color: 'green',
            });
        } else {
            notifications.show({
                title: '登録失敗',
                message: String(result?.error) || '不明なエラー',
                color: 'red',
            });
            return;
        }
        onClose();
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
                data={categories.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                }))}
                value={String(form.caegory_id)}
                onChange={(value) => setForm((f) => ({ ...f, caegory_id: Number(value) }))}
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