import { MembersPageTemplate } from "./components/Template";
import { fetchActiveUsers } from "@/app/services/api/user-server";

export default async function MembersPage() {
  const { data, error } = await fetchActiveUsers();

  if (error) {
    console.error("メンバー一覧の取得に失敗:", error);
    return <p>メンバー一覧を取得できませんでした。</p>;
  }

  if (!data) {
    return <p>メンバーが見つかりませんでした。</p>;
  }

  return <MembersPageTemplate members={data} />;
}
