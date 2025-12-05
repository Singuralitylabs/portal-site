import ApprovalTemplate from "@/app/(authenticated)/dashboard/components/ApprovalTemplate";
import { MemberAdminType } from "@/app/types";

export default function DashboardPageTemplate({ members, adminId }: { members: MemberAdminType[], adminId: number }) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>
            <ApprovalTemplate members={members} adminId={adminId} />
        </div>
    );
}
