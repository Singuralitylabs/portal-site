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
  // 現在表示中の blob: URL。差し替え・解除のたびに解放してメモリリークを防ぐ
  const objectUrlRef = useRef<string | null>(null);
  // fetchSignedUrl の実行世代。取得は createSignedUrl → fetch → blob と複数の await を挟むため、
  // 初期化時の取得とアップロード後の再取得などが重なると、先に開始した古いリクエストが
  // 後から完了して新しい結果を上書きしうる。取得開始・状態リセット・アンマウントのたびに +1 し、
  // 各 await の後で「自分が最新か」を確認して、古いリクエストの結果は破棄する。
  const requestIdRef = useRef(0);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // 進行中の fetchSignedUrl を無効化する（結果が届いても state / objectUrlRef には反映されない）
  const invalidatePendingFetch = useCallback(() => {
    requestIdRef.current += 1;
  }, []);

  // 指定パスの署名付きURLを取得し、画像実体を no-store で取得したうえで
  // blob: URL を生成して state に反映する。
  // 署名付きURLの iat/exp は秒単位のため、同一パスを同一秒内に再取得すると URL文字列が変わらず、
  // ブラウザのHTTPキャッシュ上でも同一キーとして扱われうる（その場合 cacheControl: "0" は
  // 新しいレスポンスのヘッダーであり、既にブラウザ側へ保存済みの応答を書き換えることはできない）。
  // 生成のたびに必ずユニークになる blob: URL を使うことで、React側の同値判定にもブラウザの
  // HTTPキャッシュにも依存せず、更新直後の最新画像を反映する（CDN/edge 側の stale リスクは
  // 別途 issue #431 で整理）。
  const fetchSignedUrl = useCallback(
    async (path: string) => {
      const requestId = (requestIdRef.current += 1);
      // await の後で、より新しい取得・リセット・アンマウントに追い越されていないか確認する
      const isStale = () => requestId !== requestIdRef.current;

      const supabase = createClientSupabaseClient();
      const { data, error } = await supabase.storage
        .from("profile-images")
        .createSignedUrl(path, 3600);
      if (isStale()) return;
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
        // 追い越されていた場合は blob: URL を生成せずに破棄する
        if (isStale()) return;
        const objectUrl = URL.createObjectURL(blob);
        releaseObjectUrl();
        objectUrlRef.current = objectUrl;
        setProfileImageUrl(objectUrl);
      } catch (fetchError) {
        if (isStale()) return;
        // 画像実体の取得に失敗した場合は、表示できないよりはましなので署名付きURLを直接使う
        console.error("プロフィール画像の取得エラー:", fetchError);
        releaseObjectUrl();
        setProfileImageUrl(data.signedUrl);
      }
    },
    [releaseObjectUrl]
  );

  // アンマウント時に進行中の取得を無効化し、最後の blob: URL を解放する
  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      releaseObjectUrl();
    };
  }, [releaseObjectUrl]);

  // ログイン・ログアウト・ユーザー切り替え時にDBから profile_image_path と avatar_url を取得して初期化する
  useEffect(() => {
    // user が変わった時点で、前の user 向けに進行中の fetchSignedUrl を無効化する。
    // これにより、ログアウトを挟まず別ユーザーへ直接切り替わった場合でも、
    // 前ユーザーの取得結果が新ユーザーの画面に反映されることを防ぐ。
    invalidatePendingFetch();
    const initializationRequestId = requestIdRef.current;
    if (!user) {
      setProfileImagePath(null);
      releaseObjectUrl();
      setProfileImageUrl(null);
      setGoogleAvatarUrl(null);
      return;
    }
    let cancelled = false;
    const supabase = createClientSupabaseClient();
    supabase
      .from("users")
      .select("profile_image_path, avatar_url")
      .eq("auth_id", user.id)
      .eq("is_deleted", false)
      .maybeSingle()
      .then(({ data }) => {
        // ユーザーが切り替わった / アンマウントされた後の結果は反映しない
        if (cancelled) return;

        // user_metadata はSupabase Authが保持する最新値のため優先して使用する。
        // SIGNED_IN 直後はDBへのavatar_url同期がまだ完了していない場合があるため、
        // DBのavatar_urlはメタデータが存在しない場合のフォールバックとして扱う。
        const metadataAvatarUrl =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        setGoogleAvatarUrl(metadataAvatarUrl ?? data?.avatar_url ?? null);

        // 初期化クエリ開始後に画像が更新された場合、古いパスを反映しない。
        // Googleアバターの初期化は画像状態とは独立して維持する。
        if (initializationRequestId !== requestIdRef.current) return;

        const path = data?.profile_image_path ?? null;
        setProfileImagePath(path);
        if (path) {
          fetchSignedUrl(path);
        } else {
          invalidatePendingFetch();
          releaseObjectUrl();
          setProfileImageUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, fetchSignedUrl, releaseObjectUrl, invalidatePendingFetch]);

  // 画像アップロード・削除後に呼び出す更新関数。
  // ProfilePageTemplate から呼ばれると、UserProfileMenu 側の表示も同時に更新される。
  const refreshProfileImage = useCallback(
    async (newPath?: string | null) => {
      if (newPath !== undefined) {
        // 新しいパス（または null）が渡された場合はパスごと更新
        setProfileImagePath(newPath);
        if (!newPath) {
          invalidatePendingFetch();
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
    [profileImagePath, fetchSignedUrl, releaseObjectUrl, invalidatePendingFetch]
  );

  return (
    <ProfileImageContext.Provider value={{ profileImageUrl, googleAvatarUrl, refreshProfileImage }}>
      {children}
    </ProfileImageContext.Provider>
  );
}

export const useProfileImage = () => useContext(ProfileImageContext);
