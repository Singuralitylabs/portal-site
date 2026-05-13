"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClientSupabaseClient } from "@/app/services/api/supabase-client";
import { useSupabaseAuth } from "./supabase-auth-provider";

// プロフィール画像のURLと更新関数をアプリ全体で共有するコンテキスト。
// UserProfileMenu（右上アバター）と ProfilePageTemplate（プロフィール編集画面）が
// このコンテキストを通じて同じ状態を参照するため、どちらか一方で画像を更新すると
// もう一方にもリロードなしで即時反映される。
interface ProfileImageContextType {
  // Supabase Storage の署名付きURL（有効期限1時間）。未設定なら null
  profileImageUrl: string | null;
  // 画像のパスを受け取り、署名付きURLを再取得してコンテキストを更新する。
  // newPath に文字列を渡すと新しいパスで取得、null を渡すと画像なし状態にリセット、
  // 省略すると現在のパスで再取得（キャッシュバスティング用）。
  refreshProfileImage: (newPath?: string | null) => Promise<void>;
}

const ProfileImageContext = createContext<ProfileImageContextType>({
  profileImageUrl: null,
  refreshProfileImage: async () => {},
});

export function ProfileImageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabaseAuth();
  // Storage上のファイルパス（例: "user-id/profile.jpg"）。署名付きURL再生成に使用
  const [profileImagePath, setProfileImagePath] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // 指定パスの署名付きURLを取得して state に反映する。
  // &t=... を末尾に付与することで、同一パスへの再アップロード後もブラウザキャッシュを回避する。
  const fetchSignedUrl = useCallback(async (path: string) => {
    const supabase = createClientSupabaseClient();
    const { data } = await supabase.storage
      .from("profile-images")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      setProfileImageUrl(`${data.signedUrl}&t=${Date.now()}`);
    }
  }, []);

  // ログイン・ログアウト時にDBから profile_image_path を取得して初期化する
  useEffect(() => {
    if (!user) {
      setProfileImagePath(null);
      setProfileImageUrl(null);
      return;
    }
    const supabase = createClientSupabaseClient();
    supabase
      .from("users")
      .select("profile_image_path")
      .eq("auth_id", user.id)
      .eq("is_deleted", false)
      .maybeSingle()
      .then(({ data }) => {
        const path = data?.profile_image_path ?? null;
        setProfileImagePath(path);
        if (path) fetchSignedUrl(path);
      });
  }, [user, fetchSignedUrl]);

  // 画像アップロード・削除後に呼び出す更新関数。
  // ProfilePageTemplate から呼ばれると、UserProfileMenu 側の表示も同時に更新される。
  const refreshProfileImage = useCallback(
    async (newPath?: string | null) => {
      if (newPath !== undefined) {
        // 新しいパス（または null）が渡された場合はパスごと更新
        setProfileImagePath(newPath);
        if (!newPath) {
          setProfileImageUrl(null);
          return;
        }
        await fetchSignedUrl(newPath);
      } else if (profileImagePath) {
        // パスを省略した場合は現在のパスで署名付きURLを再取得
        await fetchSignedUrl(profileImagePath);
      }
    },
    [profileImagePath, fetchSignedUrl]
  );

  return (
    <ProfileImageContext.Provider value={{ profileImageUrl, refreshProfileImage }}>
      {children}
    </ProfileImageContext.Provider>
  );
}

export const useProfileImage = () => useContext(ProfileImageContext);
