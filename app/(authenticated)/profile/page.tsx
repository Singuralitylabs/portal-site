import { getServerCurrentUser } from '@/app/services/api/supabase-server';
import { fetchUserByAuthIdInServer, updateUserProfileServerInServer } from '@/app/services/api/user-server';
import { Template } from './components/Template';

export default async function ProfilePage() {
  // サーバーサイドで利用ユーザー情報を参照
  const { authId, error: currentUserError } = await getServerCurrentUser();
  if (currentUserError) {
    console.error("認証情報の取得に失敗:", currentUserError);
    return <p>認証情報が取得できませんでした。</p>;
  }

  if (!authId) {
    return <div>ユーザー情報を読み込み中...</div>;
  }

  // Supabaseからユーザー情報を取得
  const { data: user, error } = await fetchUserByAuthIdInServer({ authId });

  if (error) {
    console.error('ユーザー取得エラー:', error);
    // ユーザーが見つからない場合は、新規ユーザーとして扱う
    if (error.message === "ユーザーが見つかりません") {
      return <div>ユーザー情報が登録されていません。管理者にお問い合わせください。</div>;
    }
    return <div>ユーザー情報の取得に失敗しました</div>;
  }

  // 参加日のフォーマット
  let joinedDate = '';
  if (user?.created_at) {
    const date = new Date(user.created_at);
    joinedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  const userData = {
    id: user?.id || 0,
    name: user?.display_name || '',
    role: user?.role || 'member',
    joinedAt: joinedDate,
    bio: user?.bio || '',
  };

  // プロフィール更新用のサーバーアクション
  async function updateProfile(displayName: string, bio: string) {
    'use server';
    
    if (!user) {
      return { success: false, message: 'ユーザーデータが見つかりません' };
    }

    // ユーザープロフィールを更新
    const { error: updateError } = await updateUserProfileServerInServer({
      id: user.id,
      displayName,
      bio,
    });
    
    if (updateError) {
      console.error("プロフィール更新エラー:", updateError);
      return { success: false, message: 'プロフィールの更新に失敗しました' };
    }
    
    return { success: true };
  }

  return <Template initialUser={userData} updateProfile={updateProfile} />;
}
