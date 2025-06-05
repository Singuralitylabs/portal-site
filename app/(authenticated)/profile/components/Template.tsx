'use client';

import { PageTitle } from '@/app/components/PageTitle';
import { Button, Paper, TextInput, Textarea, Notification } from '@mantine/core';
import { useState } from 'react';

interface User {
  name: string;
  role: string;
  joinedAt: string;
  bio: string;
}

interface ProfileTemplateProps {
  user: User;
}

export function ProfileTemplate({ user }: ProfileTemplateProps) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ここで実際のプロフィール更新処理を実装
      // 例: await updateUserProfile({ name, bio });
      console.log('Profile update:', { name, bio });
      
      // 成功通知
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setShowErrorNotification(true);
      setTimeout(() => setShowErrorNotification(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper m="0 2rem">
      <PageTitle>プロフィール</PageTitle>

      {/* プロフィール情報表示 */}
      <Paper p="md" mb="xl">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="bg-gray-200 px-3 py-1 rounded-full text-sm">
              {user.role}
            </span>
            <span className="text-sm text-gray-600">
              {user.joinedAt} に参加
            </span>
          </div>
        </div>
        <p className="text-gray-700">{user.bio || '自己紹介はまだ設定されていません。'}</p>
      </Paper>

      {/* 通知 */}
      {showSuccessNotification && (
        <Notification
          title="成功"
          color="green"
          onClose={() => setShowSuccessNotification(false)}
          className="mb-4"
        >
          プロフィールを更新しました
        </Notification>
      )}
      
      {showErrorNotification && (
        <Notification
          title="エラー"
          color="red"
          onClose={() => setShowErrorNotification(false)}
          className="mb-4"
        >
          プロフィールの更新に失敗しました
        </Notification>
      )}

      {/* プロフィール編集フォーム */}
      <Paper p="md" mb="xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                名前
              </label>
              <TextInput
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                自己紹介
              </label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                minRows={3}
              />
            </div>

            <Button type="submit" loading={isSubmitting}>
              保存
            </Button>
          </div>
        </form>
      </Paper>
    </Paper>
  );
}
