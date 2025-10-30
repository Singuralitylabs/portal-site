"use client";

import { PageTitle } from "@/app/components/PageTitle";
import { Button, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState, useEffect, useTransition } from "react";
import { ProfileUserType } from "@/app/types";

interface ProfilePageTemplateProps {
  initialUser: ProfileUserType;
  updateProfile: (
    displayName: string,
    bio: string
  ) => Promise<{ success: boolean; message?: string }>;
}

export function ProfilePageTemplate({ initialUser, updateProfile }: ProfilePageTemplateProps) {
  const [user, setUser] = useState<ProfileUserType>(initialUser);
  const [name, setName] = useState(initialUser.display_name);
  const [bio, setBio] = useState(initialUser.bio || "");
  const [isPending, startTransition] = useTransition();

  // 初期ユーザー情報が更新されたら、状態を更新
  useEffect(() => {
    setUser(initialUser);
    setName(initialUser.display_name);
    setBio(initialUser.bio || "");
  }, [initialUser]);

  // プロフィール更新処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      // サーバーアクションを呼び出してプロフィールを更新
      const { success, message } = await updateProfile(name, bio);

      if (success) {
        // 更新成功時にユーザー情報を更新（実際のデータはサーバーから再取得される）
        setUser({
          ...user,
          display_name: name,
          bio: bio,
        });

        // 成功通知
        notifications.show({
          title: "成功",
          message: "プロフィールを更新しました",
          color: "green",
          autoClose: 3000,
        });
      } else {
        // エラー通知
        console.error("プロフィール更新エラー:", message);
        notifications.show({
          title: "エラー",
          message: message || "プロフィールの更新に失敗しました",
          color: "red",
          autoClose: 3000,
        });
      }
    });
  };

  return (
    <>
      <PageTitle>プロフィール</PageTitle>

      {/* プロフィール情報表示 */}
      <div className="p-4 mb-8 bg-white rounded-lg shadow-sm">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{user.display_name}</h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="bg-gray-200 px-3 py-1 rounded-full text-sm">{user.role}</span>
            <span className="text-sm text-gray-600">
              {(() => {
                const date = new Date(user.created_at);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              })()}{" "}
              に参加
            </span>
          </div>
        </div>
        <p className="text-gray-700">{user.bio || "自己紹介はまだ設定されていません。"}</p>
      </div>

      {/* プロフィール編集フォーム */}
      <div className="p-4 mb-8 bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                名前
              </label>
              <TextInput id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                自己紹介
              </label>
              <Textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                autosize // ← これを追加して、サイズ自動調整を有効化
                minRows={5} // ← 現実的な最小行数（例：20行）
                maxRows={10} // maxRows を設定しなければ、入力に応じて無限に伸びます
              />
            </div>

            <Button type="submit" loading={isPending}>
              保存
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
