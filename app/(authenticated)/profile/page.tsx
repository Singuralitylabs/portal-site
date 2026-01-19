import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import {
  fetchUserByAuthIdInServer,
  updateUserProfileServerInServer,
} from "@/app/services/api/users-server";
import { ProfilePageTemplate } from "./components/Template";

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
    return <div>ユーザー情報の取得に失敗しました</div>;
  }

  if (!user) {
    return <div>ユーザー情報が存在しません。管理者にお問い合わせください。</div>;
  }

  // プロフィール更新用のサーバーアクション
  const updateProfile = async (
    displayName: string,
    bio: string,
    x_url: string | null,
    facebook_url: string | null,
    instagram_url: string | null,
    github_url: string | null,
    portfolio_url: string | null
  ) => {
    "use server";

    if (!user) {
      return { success: false, message: "ユーザーデータが見つかりません" };
    }

    if (displayName.trim() === "") {
      return { success: false, message: "表示名は必須です" };
    }

    // ユーザープロフィールを更新
    const updateError = await updateUserProfileServerInServer({
      id: user.id,
      displayName,
      bio,
      x_url,
      facebook_url,
      instagram_url,
      github_url,
      portfolio_url,
    });

    if (updateError) {
      console.error("プロフィール更新エラー:", updateError);
      return { success: false, message: "プロフィールの更新に失敗しました" };
    }

    return { success: true };
  };

  return <ProfilePageTemplate initialUser={user} updateProfile={updateProfile} />;
}
