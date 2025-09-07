"use client";

import { useSupabaseAuth } from "@/app/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchUserStatusById } from "../services/api/users-client";
import { UserStatusType } from "../types";
import { USER_STATUS } from "../constants/user";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<UserStatusType | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // ユーザーのステータスを確認
    const checkUserStatus = async () => {
      try {
        const { status, error } = await fetchUserStatusById({ authId: user.id });

        if (error || !status) {
          router.push("/login");
          return;
        }

        // ステータスに応じてリダイレクト
        if (status === USER_STATUS.PENDING) {
          router.push("/pending");
          return;
        } else if (status === USER_STATUS.REJECTED) {
          router.push("/rejected");
          return;
        } else if (status !== USER_STATUS.ACTIVE) {
          console.error("不正なユーザーステータス:", status);
          router.push("/login");
          return;
        }
        setUserStatus(status as UserStatusType);
      } catch (error) {
        console.error("ユーザーステータス確認エラー:", error);
        router.push("/login");
      } finally {
        setStatusLoading(false);
      }
    };

    checkUserStatus();
  }, [user, loading, router]);

  // ローディング中
  if (loading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">読み込み中...</div>
        </div>
      </div>
    );
  }

  // 認証済みかつactiveな場合のみコンテンツを表示
  if (user && userStatus === USER_STATUS.ACTIVE) {
    return <>{children}</>;
  }

  // その他の場合は何も表示しない（リダイレクト処理が実行される）
  return null;
}
