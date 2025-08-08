import { useState, useEffect } from 'react';
import { Modal, TextInput, Select, Textarea, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { registerDocument, updateDocument } from '@/app/services/api/documents-client';
import type { CategoryType } from '@/app/types';
import { z } from 'zod';

interface DocumentFormModalProps {
    opened: boolean;
    onClose: () => void;
    categories: CategoryType[];
    userId: number;
    type: 'create' | 'edit'; // モーダルのタイプ（新規作成 or 編集）
    editData?: {
        id: number;
        name: string;
        category_id: number;
        description: string;
        url: string;
        assignee: string;
    }; // 編集時のデータ
}

export function DocumentFormModal({ opened, onClose, categories, userId, type, editData }: DocumentFormModalProps) {
    const [form, setForm] = useState({
        name: editData?.name ?? '',
        category_id: editData?.category_id ?? 0,
        description: editData?.description ?? '',
        url: editData?.url ?? '',
        assignee: editData?.assignee ?? '',
    });

    // モーダルが開かれたときに編集データをセット
    // 編集時はeditDataが変わるたびにformを更新
    // 新規時は空にリセット
    useEffect(() => {
        if (opened) {
            if (type === 'edit' && editData) {
                setForm({
                    name: editData.name,
                    category_id: editData.category_id,
                    description: editData.description,
                    url: editData.url,
                    assignee: editData.assignee,
                });
            } else {
                setForm({
                    name: '',
                    category_id: 0,
                    description: '',
                    url: '',
                    assignee: '',
                });
            }
        }
    }, [opened, type, editData]);

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

        let result;
        if (type === 'edit' && editData) {
            // 編集時
            result = await updateDocument({
                id: editData.id,
                name: form.name,
                category_id: form.category_id,
                description: form.description,
                url: form.url,
                assignee: form.assignee,
                updated_by: userId,
            });
        } else {
            // 新規登録時
            result = await registerDocument({
                name: form.name,
                category_id: form.category_id,
                description: form.description,
                url: form.url,
                assignee: form.assignee,
                created_by: userId,
            });
        }

        if (result?.success) {
            notifications.show({
                title: type === 'edit' ? '更新完了' : '登録完了',
                message: type === 'edit' ? '資料が正常に更新されました。' : '資料が正常に登録されました。',
                color: 'green',
            });
        } else {
            notifications.show({
                title: type === 'edit' ? '更新失敗' : '登録失敗',
                message: String(result?.error) || '不明なエラー',
                color: 'red',
            });
            return;
        }
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={type === 'edit' ? '資料編集' : '資料新規登録'} centered>
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
                    {type === 'edit' ? '更新' : '登録'}
                </Button>
            </Group>
        </Modal>
    );
}