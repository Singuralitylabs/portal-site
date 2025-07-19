"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientSupabaseClient } from "@/app/services/api/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userStatus: "pending" | "active" | "rejected" | null;
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
  initialUserStatus?: "pending" | "active" | "rejected" | null;
}

export function SupabaseAuthProvider({
  children,
  initialUser = null,
  initialUserStatus = null,
}: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [session, setSession] = useState<Session | null>(null);
  const [userStatus, _] = useState<"pending" | "active" | "rejected" | null>(initialUserStatus);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    const supabase = createClientSupabaseClient();

    // 現在のユーザーを取得（セキュア）
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error("認証エラー:", error);
        setUser(null);
        setSession(null);
      } else {
        setUser(user);
        // getUser()ではsessionは直接取得できないため、getSession()も併用
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
        });
      }
      setLoading(false);
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
      const supabase = createClientSupabaseClient();

      // ユーザーが既にusersテーブルに存在するかチェック
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!existingUser) {
        // 新規ユーザーの場合、usersテーブルに追加
        await supabase.from("users").insert({
          auth_id: user.id,
          email: user.email!,
          display_name: user.user_metadata?.full_name || user.email!,
          role: "member",
          status: "pending",
        });
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
