import { useState, useEffect } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { registerDocument, updateDocument } from '@/app/services/api/documents-client';
import type { CategoryType } from '@/app/types';
import { z } from 'zod';
import type { DocumentUpdateFormType } from "@/app/types";

interface DocumentFormModalProps {
    opened: boolean;
    onClose: () => void;
    categories: CategoryType[];
    userId: number;
    initialData?: DocumentUpdateFormType; // 編集時のデータ
}

export function DocumentFormModal({ opened, onClose, categories, userId, initialData }: DocumentFormModalProps) {
    const [form, setForm] = useState({
        name: initialData?.name ?? '',
        category_id: initialData?.category_id ?? 0,
        description: initialData?.description ?? '',
        url: initialData?.url ?? '',
        assignee: initialData?.assignee ?? '',
    });
    const router = useRouter();

    // モーダルが開かれたとき、編集時はinitialDataでformを更新
    useEffect(() => {
        setForm({
            name: initialData?.name ?? "",
            category_id: initialData?.category_id ?? 0,
            description: initialData?.description ?? "",
            url: initialData?.url ?? "",
            assignee: initialData?.assignee ?? "",
        });
    }, [opened, initialData]);

    const handleSubmit = async () => {
        if (!form.name || !form.url || form.category_id === 0 || form.url.trim() === "") {
            notifications.show({
                title: '入力エラー',
                message: '資料名とURL及びカテゴリーは必須です',
                color: 'red',
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
                title: '入力エラー',
                message: urlValidation.error?.message || '正しいURLを入力してください',
                color: 'red',
            });
            return;
        }

        // API呼び出し(初期値あり：編集時は更新、初期値なし：新規登録)
        const result = initialData
            ? await updateDocument({ ...form, id: initialData.id, updated_by: userId })
            : await registerDocument({ ...form, created_by: userId });

        if (result?.success) {
            notifications.show({
                title: initialData ? '更新完了' : '登録完了',
                message: initialData ? '資料が正常に更新されました。' : '資料が正常に登録されました。',
                color: 'green',
            });
            router.refresh();
        } else {
            notifications.show({
                title: initialData ? '更新失敗' : '登録失敗',
                message: String(result?.error) || '不明なエラー',
                color: 'red',
            });
            return;
        }
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={initialData ? '資料編集' : '資料新規登録'} centered>
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
                value={String(form.category_id)}
                onChange={(value) => setForm((f) => ({ ...f, category_id: Number(value) }))}
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
                <Button color="blue" onClick={handleSubmit}>
                    {initialData ? '更新' : '登録'}
                </Button>
            </Group>
        </Modal>
    );
}