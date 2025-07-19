'use client';

import { useSupabaseAuth } from '@/app/providers/supabase-auth-provider';
import { createClientSupabaseClient } from '@/app/services/api/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserStatus {
  status: 'pending' | 'active' | 'rejected';
  display_name: string;
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // ユーザーのステータスを確認
    const checkUserStatus = async () => {
      try {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
          .from('users')
          .select('status, display_name')
          .eq('auth_id', user.id)
          .eq('is_deleted', false)
          .single();

        if (error || !data) {
          // ユーザーが見つからない場合は登録が必要
          router.push('/login');
          return;
        }

        setUserStatus(data);
        
        // ステータスに応じてリダイレクト
        if (data.status === 'pending') {
          router.push('/pending');
          return;
        } else if (data.status === 'rejected') {
          router.push('/rejected');
          return;
        }
        // activeの場合はそのまま表示

      } catch (error) {
        console.error('ユーザーステータス確認エラー:', error);
        router.push('/login');
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
  if (user && userStatus?.status === 'active') {
    return <>{children}</>;
  }

  // その他の場合は何も表示しない（リダイレクト処理が実行される）
  return null;
}