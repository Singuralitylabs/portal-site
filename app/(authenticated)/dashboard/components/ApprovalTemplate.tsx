import { MemberApprovalCard } from "./MemberCardApproval";
import { MemberAdminType } from "@/app/types";

export default function ApprovalTemplate({ members, adminId }: { members: MemberAdminType[], adminId: number }) {

    return (
        <div className="p-4 overflow-x-hidden">
            <div>承認管理</div>
            <div>
                {members.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
                            {/* filterで、承認待ちのメンバーを表示 */}
                            {members.filter(member => member.status === "pending").map(member => (
                                <MemberApprovalCard member={member} adminId={adminId} />
                            ))}
                        </div>
                    </>
                )}
            </div>
            {/* <!--- メンバー一覧（管理者）を確認:リンク表示 -->*/}</div>
    );
}
