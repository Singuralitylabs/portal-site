import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import { fetchUserInfoByAuthId } from "@/app/services/api/users-server";
import { checkContentPermissions } from "@/app/services/auth/permissions";
import {
  fetchDeletedDocuments,
  fetchDeletedVideos,
  fetchDeletedApplications,
  fetchDeletedCategories,
} from "@/app/services/api/trash-server";
import { TrashPageTemplate } from "./components/Template";

export default async function TrashPage() {
  const { authId, error: currentUserError } = await getServerCurrentUser();
  if (currentUserError) {
    console.error("認証情報の取得に失敗:", currentUserError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">認証情報を取得できませんでした。</p>
      </div>
    );
  }

  const { id: userId, role, error: roleError } = await fetchUserInfoByAuthId({ authId });
  if (roleError || !role) {
    console.error("ユーザー情報の取得に失敗:", roleError);
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">ユーザー情報を取得できませんでした。</p>
      </div>
    );
  }

  if (!checkContentPermissions(role)) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">ゴミ箱へのアクセス権限がありません。</p>
      </div>
    );
  }

  const [documents, videos, applications, categories] = await Promise.all([
    fetchDeletedDocuments(),
    fetchDeletedVideos(),
    fetchDeletedApplications(),
    fetchDeletedCategories(),
  ]);

  if (documents.error || videos.error || applications.error || categories.error) {
    console.error("削除済みデータの取得に失敗:", {
      documents: documents.error,
      videos: videos.error,
      applications: applications.error,
      categories: categories.error,
    });
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-xl">データの取得に失敗しました。</p>
      </div>
    );
  }

  return (
    <TrashPageTemplate
      userId={userId}
      initialData={{
        documents: documents.data ?? [],
        videos: videos.data ?? [],
        applications: applications.data ?? [],
        categories: categories.data ?? [],
      }}
    />
  );
}
