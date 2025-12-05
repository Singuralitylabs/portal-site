import { MemberApprovalCard } from "@/app/(authenticated)/dashboard/components/MemberCardApproval";
import { MemberAdminType } from "@/app/types";

export default function ApprovalTemplate({ members, adminId }: { members: MemberAdminType[], adminId: number }) {

    return (
        <div className="p-4 overflow-x-hidden">
            <div>承認管理</div>
            <div>
                {members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
                        {members.map(member => (
                            <MemberApprovalCard key={member.id} member={member} adminId={adminId} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mt-4">承認待ちのユーザーはいません。</p>
                )}
            </div>
        </div>
    );
}