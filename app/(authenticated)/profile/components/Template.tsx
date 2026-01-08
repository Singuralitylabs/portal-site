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
    bio: string,
    x_url: string | null,
    facebook_url: string | null,
    instagram_url: string | null,
    github_url: string | null,
    portfolio_url: string | null
  ) => Promise<{ success: boolean; message?: string }>;
}

export function ProfilePageTemplate({ initialUser, updateProfile }: ProfilePageTemplateProps) {
  const [user, setUser] = useState<ProfileUserType>(initialUser);
  const [name, setName] = useState(initialUser.display_name);
  const [bio, setBio] = useState(initialUser.bio || "");
  const [x_url, setXUrl] = useState(initialUser.x_url || "");
  const [facebook_url, setFacebookUrl] = useState(initialUser.facebook_url || "");
  const [instagram_url, setInstagramUrl] = useState(initialUser.instagram_url || "");
  const [github_url, setGithubUrl] = useState(initialUser.github_url || "");
  const [portfolio_url, setPortfolioUrl] = useState(initialUser.portfolio_url || "");
  // エラーメッセージ管理用のステートを追加
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // 初期ユーザー情報が更新されたら、状態を更新
  useEffect(() => {
    setUser(initialUser);
    setName(initialUser.display_name);
    setBio(initialUser.bio || "");
    setXUrl(initialUser.x_url || "");
    setFacebookUrl(initialUser.facebook_url || "");
    setInstagramUrl(initialUser.instagram_url || "");
    setGithubUrl(initialUser.github_url || "");
    setPortfolioUrl(initialUser.portfolio_url || "");
    setErrors({}); // エラーもリセット
  }, [initialUser]);

  // URL形式チェック関数
  const validateUrl = (url: string | null) => {
    if (!url) return true;
    return /^https?:\/\//.test(url);
  };

  // プロフィール更新処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // URLのバリデーションチェック
    const newErrors: Record<string, string> = {};
    if (!validateUrl(x_url))
      newErrors.x_url =
        "URLは http:// または https:// で始めてください。無ければ空欄にしてください。";
    if (!validateUrl(facebook_url))
      newErrors.facebook_url =
        "URLは http:// または https:// で始めてください。無ければ空欄にしてください。";
    if (!validateUrl(instagram_url))
      newErrors.instagram_url =
        "URLは http:// または https:// で始めてください。無ければ空欄にしてください。";
    if (!validateUrl(github_url))
      newErrors.github_url =
        "URLは http:// または https:// で始めてください。無ければ空欄にしてください。";
    if (!validateUrl(portfolio_url))
      newErrors.portfolio_url =
        "URLは http:// または https:// で始めてください。無ければ空欄にしてください。";

    // URL入力にエラーがあれば表示して中断
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notifications.show({
        title: "入力エラー",
        message: "URLの形式を確認してください",
        color: "red",
      });
      return;
    }

    // エラーがなければステートをクリアして送信開始
    setErrors({});

    startTransition(async () => {
      // サーバーアクションを呼び出してプロフィールを更新
      const { success, message } = await updateProfile(
        name,
        bio,
        x_url || null,
        facebook_url || null,
        instagram_url || null,
        github_url || null,
        portfolio_url || null
      );

      if (success) {
        // 更新成功時にユーザー情報を更新（実際のデータはサーバーから再取得される）
        setUser({
          ...user,
          display_name: name,
          bio,
          x_url,
          facebook_url,
          instagram_url,
          github_url,
          portfolio_url,
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

      {/* プロフィール情報表示*/}
      <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
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

        {/* bio（自己紹介テキスト）のみコメントアウトして非表示にする
        <p className="text-gray-700">{user.bio || "自己紹介はまだ設定されていません。"}</p>
        */}
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
                minRows={5} // ← 現実的な最小行数（例：5行）
                maxRows={10} // maxRows を設定しなければ、入力に応じて無限に伸びます
              />
            </div>

            <div>
              <label htmlFor="x_url" className="block text-sm font-medium mb-1">
                X URL
              </label>
              <TextInput
                id="x_url"
                placeholder="https://x.com/..."
                value={x_url}
                onChange={e => setXUrl(e.target.value)}
                error={errors.x_url}
              />
            </div>

            <div>
              <label htmlFor="facebook_url" className="block text-sm font-medium mb-1">
                Facebook URL
              </label>
              <TextInput
                id="facebook_url"
                placeholder="https://facebook.com/..."
                value={facebook_url}
                onChange={e => setFacebookUrl(e.target.value)}
                error={errors.facebook_url}
              />
            </div>

            <div>
              <label htmlFor="instagram_url" className="block text-sm font-medium mb-1">
                Instagram URL
              </label>
              <TextInput
                id="instagram_url"
                placeholder="https://instagram.com/..."
                value={instagram_url}
                onChange={e => setInstagramUrl(e.target.value)}
                error={errors.instagram_url}
              />
            </div>

            <div>
              <label htmlFor="github_url" className="block text-sm font-medium mb-1">
                GitHub URL
              </label>
              <TextInput
                id="github_url"
                placeholder="https://github.com/..."
                value={github_url}
                onChange={e => setGithubUrl(e.target.value)}
                error={errors.github_url}
              />
            </div>

            <div>
              <label htmlFor="portfolio_url" className="block text-sm font-medium mb-1">
                ポートフォリオサイトのURL
              </label>
              <TextInput
                id="portfolio_url"
                placeholder="https://your-portfolio.com/..."
                value={portfolio_url}
                onChange={e => setPortfolioUrl(e.target.value)}
                error={errors.portfolio_url}
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
