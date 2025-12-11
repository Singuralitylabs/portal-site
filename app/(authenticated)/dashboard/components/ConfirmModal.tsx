"use client";

import { useRouter } from "next/navigation";
import { ApproveAction, MemberAdminType } from "@/app/types";
import { approveUser, rejectUser } from "@/app/services/api/users-client";
import { USER_ACTION } from "@/app/constants/user";

export default function ConfirmModal({
  open,
  onClose,
  type,
  member,
}: {
  open: boolean;
  onClose: () => void;
  type: ApproveAction;
  member: MemberAdminType;
  adminId: number;
}) {
  const router = useRouter();
  if (!open) return null;

  const actionLabel = type === USER_ACTION.APPROVE ? "承認" : "否認";

  const handleConfirm = async () => {
    try {
      if (type === USER_ACTION.APPROVE) {
        await approveUser({ userId: member.id });
      } else if (type === USER_ACTION.REJECT) {
        await rejectUser({ userId: member.id });
      }
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
        <p>
          {member.display_name} さんを {actionLabel} しますか？
        </p>

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-1 bg-gray-300 rounded" onClick={onClose}>
            キャンセル
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleConfirm}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
