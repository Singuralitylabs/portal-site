import { MembersPageTemplate } from "./components/Template";
import { fetchActiveUsers, fetchActivePositions } from "@/app/services/api/users-server";

export default async function MembersPage() {
  const [{ data, error }, { data: positions }] = await Promise.all([
    fetchActiveUsers(),
    fetchActivePositions(),
  ]);

  if (error || !data) {
    console.error("会員一覧の取得に失敗:", error);
    return <p>会員一覧を取得できませんでした。</p>;
  }

  return <MembersPageTemplate members={data} positions={positions ?? []} />;
}
