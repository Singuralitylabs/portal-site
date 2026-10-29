import { PageTitle } from "@/app/components/PageTitle";
import { fetchMasterManagementData } from "@/app/services/api/master-server";
import { getServerCurrentUser } from "@/app/services/api/supabase-server";
import { fetchUserInfoByAuthId } from "@/app/services/api/users-server";
import { checkContentPermissions } from "@/app/services/auth/permissions";
import { MasterPageTemplate } from "./components/Template";

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-8">
      <p className="text-red-600 text-xl">{children}</p>
    </div>
  );
}

export default async function MasterPage() {
  const { authId, error: currentUserError } = await getServerCurrentUser();
  if (currentUserError) {
    console.error("認証情報の取得に失敗:", currentUserError);
    return <ErrorMessage>認証情報を取得できませんでした。</ErrorMessage>;
  }

  const { role, error: roleError } = await fetchUserInfoByAuthId({ authId });
  if (roleError || !role) {
    console.error("ユーザー情報の取得に失敗:", roleError);
    return <ErrorMessage>ユーザー情報を取得できませんでした。</ErrorMessage>;
  }

  if (!checkContentPermissions(role)) {
    return <ErrorMessage>マスター管理へのアクセス権限がありません。</ErrorMessage>;
  }

  const { data, error } = await fetchMasterManagementData();
  if (error || !data) {
    console.error("マスター管理データの取得に失敗:", error);
    return (
      <>
        <PageTitle>マスター管理</PageTitle>
        <ErrorMessage>マスター管理データを取得できませんでした。</ErrorMessage>
      </>
    );
  }

  return <MasterPageTemplate initialData={data} />;
}
