'use client';

import { createClientSupabaseClient } from '@/app/services/api/supabase';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          シンラボポータルサイト
        </h1>
        
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            ※現在、管理者による承認待ちです。
          </p>
          <p className="text-gray-600">
            承認完了まで今しばらくお待ちください。
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}