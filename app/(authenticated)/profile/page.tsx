import { currentUser } from '@clerk/nextjs/server';
import { getUserByClerkId, updateUserProfile } from '@/app/services/api/user';
import { Template } from './components/Template';

// プロフィール更新用のサーバーアクション
async function updateProfileAction(displayName: string, bio: string) {
  'use server';
  
  // Clerk認証情報の取得（例外が発生する可能性あり）
  let idpUser;
  try {
    idpUser = await currentUser();
  } catch (error) {
    console.error('認証情報取得エラー:', error);
    return { success: false, message: '認証情報の取得に失敗しました' };
  }
  
  if (!idpUser) {
    return { success: false, message: 'ユーザー認証情報が見つかりません' };
  }
  
  // Supabaseからユーザー情報を取得
  const { data: user, error: getUserError } = await getUserByClerkId(idpUser.id);
  if (getUserError || !user) {
    return { success: false, message: 'ユーザーデータが見つかりません' };
  }
  
  // ユーザープロフィールを更新
  const { error: updateError } = await updateUserProfile({
    id: user.id,
    displayName,
    bio,
  });
  
  if (updateError) {
    return { success: false, message: 'プロフィールの更新に失敗しました' };
  }
  
  return { success: true };
}

export default async function ProfilePage() {
  // Clerk認証情報の取得（例外が発生する可能性あり）
  let idpUser;
  try {
    idpUser = await currentUser();
  } catch (error) {
    console.error('認証情報取得エラー:', error);
    return <div>認証情報の取得に失敗しました</div>;
  }
  
  if (!idpUser) {
    return <div>ユーザー情報を読み込み中...</div>;
  }

  // Supabaseからユーザー情報を取得
  const { data: user, error } = await getUserByClerkId(idpUser.id);
  
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
    name: user?.display_name || idpUser.firstName || '',
    role: user?.role || 'メンバー',
    joinedAt: joinedDate,
    bio: user?.bio || '',
  };

  return <Template initialUser={userData} updateProfile={updateProfileAction} />;
}
