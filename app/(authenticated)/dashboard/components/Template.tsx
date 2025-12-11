import { PageTitle } from "@/app/components/PageTitle";
import { MemberAdminType } from "@/app/types";
import { MemberActionCard } from "./MemberActionCard";

export default function DashboardPageTemplate({
  members,
  adminId,
}: {
  members: MemberAdminType[];
  adminId: number;
}) {
  return (
    <div className="p-6">
      <PageTitle>ダッシュボード</PageTitle>
      <div className="p-4 overflow-x-hidden">
        <h2 className="scroll-mt-40">承認管理</h2>
        <div>
          {members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {members.map(member => (
                <MemberActionCard key={member.id} member={member} adminId={adminId} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mt-4">承認待ちのユーザーはいません。</p>
          )}
        </div>
      </div>
    </div>
  );
}
