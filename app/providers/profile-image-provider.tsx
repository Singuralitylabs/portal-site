"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClientSupabaseClient } from "@/app/services/api/supabase-client";
import { useSupabaseAuth } from "./supabase-auth-provider";

// プロフィール画像のURLと更新関数をアプリ全体で共有するコンテキスト。
// UserProfileMenu（右上アバター）と ProfilePageTemplate（プロフィール編集画面）が
// このコンテキストを通じて同じ状態を参照するため、どちらか一方で画像を更新すると
// もう一方にもリロードなしで即時反映される。
interface ProfileImageContextType {
  // 表示用URL（blob: URL。取得失敗時は署名付きURLへのフォールバック）。未設定なら null
  profileImageUrl: string | null;
  // DBに保存されたGoogle OAuth の avatar_url（ログイン時に最新化）
  googleAvatarUrl: string | null;
  // 画像のパスを受け取り、署名付きURLを再取得してコンテキストを更新する。
  // newPath に文字列を渡すと新しいパスで取得、null を渡すと画像なし状態にリセット、
  // 省略すると現在のパスで再取得（キャッシュバスティング用）。
  refreshProfileImage: (newPath?: string | null) => Promise<void>;
}

const ProfileImageContext = createContext<ProfileImageContextType>({
  profileImageUrl: null,
  googleAvatarUrl: null,
  refreshProfileImage: async () => {},
});

export function ProfileImageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabaseAuth();
  // Storage上のファイルパス（例: "user-id/profile-image"）。署名付きURL再生成に使用
  const [profileImagePath, setProfileImagePath] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  // 直前に生成した blob: URL。差し替え・解除のたびに解放してメモリリークを防ぐ
  const objectUrlRef = useRef<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // 指定パスの署名付きURLを取得し、画像実体を no-store で取得したうえで
  // blob: URL を生成して state に反映する。
  // 署名付きURLの iat/exp は秒単位のため、同一パスを同一秒内に再取得すると
  // URL文字列が変わらず、ブラウザのHTTPキャッシュ上でも同一キーとして扱われうる
  // （その場合 cacheControl: "0" は新しいレスポンスのヘッダーであり、
  // 既にブラウザ側へ保存済みの応答を書き換えることはできない）。
  // blob: URL は生成のたびに必ずユニークになるため、React側の同値判定にも
  // ブラウザのHTTPキャッシュにも依存せず、確実に最新の画像を反映できる。
  const fetchSignedUrl = useCallback(
    async (path: string) => {
      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase.storage
        .from("profile-images")
        .createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) {
        releaseObjectUrl();
        setProfileImageUrl(null);
        return;
      }
      try {
        const response = await fetch(data.signedUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`画像の取得に失敗しました: ${response.status}`);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        releaseObjectUrl();
        objectUrlRef.current = objectUrl;
        setProfileImageUrl(objectUrl);
      } catch (fetchError) {
        // 画像実体の取得に失敗した場合は、表示できないよりはましなので署名付きURLを直接使う
        console.error("プロフィール画像の取得エラー:", fetchError);
        releaseObjectUrl();
        setProfileImageUrl(data.signedUrl);
      }
    },
    [releaseObjectUrl]
  );

  // アンマウント時に最後の blob: URL を解放する
  useEffect(() => {
    return () => releaseObjectUrl();
  }, [releaseObjectUrl]);

  // ログイン・ログアウト時にDBから profile_image_path と avatar_url を取得して初期化する
  useEffect(() => {
    if (!user) {
      setProfileImagePath(null);
      releaseObjectUrl();
      setProfileImageUrl(null);
      setGoogleAvatarUrl(null);
      return;
    }
    const supabase = createClientSupabaseClient();
    supabase
      .from("users")
      .select("profile_image_path, avatar_url")
      .eq("auth_id", user.id)
      .eq("is_deleted", false)
      .maybeSingle()
      .then(({ data }) => {
        const path = data?.profile_image_path ?? null;
        setProfileImagePath(path);
        if (path) {
          fetchSignedUrl(path);
        } else {
          releaseObjectUrl();
          setProfileImageUrl(null);
        }
        // user_metadata はSupabase Authが保持する最新値のため優先して使用する。
        // SIGNED_IN 直後はDBへのavatar_url同期がまだ完了していない場合があるため、
        // DBのavatar_urlはメタデータが存在しない場合のフォールバックとして扱う。
        const metadataAvatarUrl =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        setGoogleAvatarUrl(metadataAvatarUrl ?? data?.avatar_url ?? null);
      });
  }, [user, fetchSignedUrl, releaseObjectUrl]);

  // 画像アップロード・削除後に呼び出す更新関数。
  // ProfilePageTemplate から呼ばれると、UserProfileMenu 側の表示も同時に更新される。
  const refreshProfileImage = useCallback(
    async (newPath?: string | null) => {
      if (newPath !== undefined) {
        // 新しいパス（または null）が渡された場合はパスごと更新
        setProfileImagePath(newPath);
        if (!newPath) {
          releaseObjectUrl();
          setProfileImageUrl(null);
          return;
        }
        await fetchSignedUrl(newPath);
      } else if (profileImagePath) {
        // パスを省略した場合は現在のパスで署名付きURLを再取得
        await fetchSignedUrl(profileImagePath);
      }
    },
    [profileImagePath, fetchSignedUrl, releaseObjectUrl]
  );

  return (
    <ProfileImageContext.Provider value={{ profileImageUrl, googleAvatarUrl, refreshProfileImage }}>
      {children}
    </ProfileImageContext.Provider>
  );
}

export const useProfileImage = () => useContext(ProfileImageContext);
