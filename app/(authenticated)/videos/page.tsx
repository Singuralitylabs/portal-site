import { getServerCurrentUser } from '@/app/services/api/supabase-server';
import { fetchUserInfoByAuthId } from '@/app/services/api/user-server';
import { fetchVideos } from '@/app/services/api/videos-server';
import { fetchCategoriesByType } from '@/app/services/api/categories';
import { VideosPageTemplate } from './components/Template';
import { canContentManager } from "@/app/services/auth/server-auth";

export default async function VideosPage() {
  // サーバーサイドで利用ユーザー情報を参照
  const { authId, error: currentUserError } = await getServerCurrentUser();
  if (currentUserError) {
    console.error("認証情報の取得に失敗:", currentUserError);
    return <p>認証情報が取得できませんでした。</p>;
  }

  const { data, error } = await fetchVideos();
  const { data: dataCategory, error: errorCategory } = await fetchCategoriesByType("videos");
  const { id, role, error: roleError } = await fetchUserInfoByAuthId({ authId: authId });
  const isContentMgr = canContentManager(role);

  if (error || errorCategory || roleError) {
    console.error("データの取得に失敗:", error || errorCategory || roleError);
    return <p>データを取得できませんでした。</p>;
  }

  return (
    <VideosPageTemplate
      videos={data}
      categories={dataCategory}
      isContentMgr={isContentMgr}
      userId={id}
    />
  );
}
