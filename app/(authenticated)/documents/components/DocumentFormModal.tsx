import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { registerDocument } from '@/app/services/api/documents-client';
import type { CategoryType } from '@/app/types';

interface Props {
    opened: boolean;
    onClose: () => void;
    categories: CategoryType[];
    userId: number;
}

export function DocumentFormModal({ opened, onClose, categories, userId }: Props) {
    const [form, setForm] = useState({
        name: '',
        categoryId: 0,
        description: '',
        url: '',
        assignee: '',
    });

    // モーダルを閉じる時にフォームもリセット
    const handleClose = () => {
        setForm({
            name: '',
            categoryId: 0,
            description: '',
            url: '',
            assignee: '',
        });
        onClose();
    };

    const handleSubmit = async () => {
        if (!form.name || !form.url || form.categoryId === 0 || form.url.trim() === "") {
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

        const { error } = await registerDocument({
            name: form.name,
            categoryId: form.categoryId,
            description: form.description,
            url: form.url,
            assignee: form.assignee,
            userId,
        });

        if (error) {
            notifications.show({
                title: '登録エラー',
                message: `ドキュメントの作成に失敗: ${error.hint || error.message}`, // ユーザー向けのエラーメッセージを表示
                color: 'red',
            });
            return;
        }

        notifications.show({
            title: '登録完了',
            message: '正常に登録されました',
            color: 'green',
        });
        handleClose();
    };

    return (
        <Modal opened={opened} onClose={handleClose} title="資料新規登録" centered>
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
                value={String(form.categoryId)}
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
                <Button variant="default" onClick={handleClose}>キャンセル</Button>
                <Button color="blue" onClick={handleSubmit}>登録</Button>
            </Group>
        </Modal>
    );
}