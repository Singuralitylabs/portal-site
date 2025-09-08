"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";
import { createClientSupabaseClient } from "../services/api/supabase-client";
import { UserStatusType } from "../types";
import { addNewUser, fetchUserIdByAuthId } from "../services/api/users-client";

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userStatus: UserStatusType | null;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
  loading: true,
  userStatus: null,
});

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  initialUserStatus?: UserStatusType | null;
}

export function SupabaseAuthProvider({
  children,
  initialUser = null,
  initialUserStatus = null,
}: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [session, setSession] = useState<Session | null>(null);
  const [userStatus, _] = useState<UserStatusType | null>(initialUserStatus);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    const supabase = createClientSupabaseClient();

    // 現在のユーザーを取得（セキュア）
    supabase.auth
      .getUser()
      .then(
        ({ data: { user }, error }: { data: { user: User | null }; error: AuthError | null }) => {
          if (error) {
            console.error("認証エラー:", error);
            setUser(null);
            setSession(null);
          } else {
            setUser(user);
            // getUser()ではsessionは直接取得できないため、getSession()も併用
            supabase.auth
              .getSession()
              .then(
                ({
                  data: { session },
                  error: sessionError,
                }: {
                  data: { session: Session | null };
                  error: AuthError | null;
                }) => {
                  if (sessionError) {
                    console.error("セッション取得エラー:", sessionError);
                  } else {
                    setSession(session);
                  }
                }
              );
          }
          setLoading(false);
        }
      );

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // ユーザー作成時の処理
      if (event === "SIGNED_IN" && session?.user) {
        // 初回ログイン時のユーザー情報をusersテーブルに同期
        syncUserToDatabase(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserToDatabase = async (user: User) => {
    try {
      // ユーザーが既にusersテーブルに存在するかチェック
      const { userId, error: userError } = await fetchUserIdByAuthId({ authId: user.id });
      // 新規ユーザーの場合、usersテーブルに追加
      if (!userId || userError) {
        const { error: newUserError } = await addNewUser({
          authId: user.id,
          email: user.email || "",
          displayName: user.user_metadata?.full_name || "",
          avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        });

        if (!newUserError) {
          console.log("新規ユーザーをusersテーブルに追加:", user.id);

          // 新規ユーザー作成成功後にSlack通知を送信（非同期で実行、エラーでも処理は継続）
          try {
            const response = await fetch("/api/notifications/slack", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                displayName: user.user_metadata?.full_name || "",
                authId: user.id,
              }),
            });

            if (!response.ok) {
              const result = await response.json();
              console.error(
                "Slack通知の送信に失敗しましたが、ユーザー作成は完了しました:",
                result.error
              );
            }
          } catch (notificationError) {
            console.error("Slack通知の送信に失敗:", notificationError);
          }
        }
      }
    } catch (error) {
      console.error("ユーザー情報の同期エラー:", error);
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, session, loading, userStatus }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
};
