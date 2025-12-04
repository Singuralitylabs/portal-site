"use client";

import { useRouter } from "next/navigation";
import { ActionLabelMap, ApproveAction, MemberAdminType } from "@/app/types";
import { approveUser, rejectUser } from "@/app/services/api/users-client";

export default function ConfirmModal({
    open,
    onClose,
    type,
    member
}: {
    open: boolean;
    onClose: () => void;
    type: ApproveAction;
    member: MemberAdminType;
    adminId: number;
}) {
    const router = useRouter();
    if (!open) return null;

    const actionLabel = ActionLabelMap[type];

    // 確認ボタンがクリックされたときの処理
    const handleConfirm = async () => {
        try {
            if (type === "approve") {
                await approveUser({ userId: member.id });
            } else if (type === "reject") {
                await rejectUser({ userId: member.id });
            }
            console.log(`${actionLabel} 実行成功`);
            router.refresh();
        } catch (err) {
            console.error(`${actionLabel} 実行失敗`, err);
        } finally {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                <h2 className="text-lg font-bold mb-4">{actionLabel}確認</h2>
                <p>{member.display_name} さんを {actionLabel} しますか？</p>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        className="px-3 py-1 bg-gray-300 rounded"
                        onClick={onClose}
                    >
                        キャンセル
                    </button>
                    <button
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                        onClick={handleConfirm}
                    >
                        {actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}