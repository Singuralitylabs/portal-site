"use client";

import { UserActionType, MemberAdminType } from "@/app/types";
import { Card } from "@mantine/core";
import { useState } from "react";

import ConfirmModal from "@/app/(authenticated)/dashboard/components/ConfirmModal";
import { USER_ACTION } from "@/app/constants/user";

interface MemberAdminCardProps {
  member: MemberAdminType;
}

export function MemberActionCard({ member }: MemberAdminCardProps) {
  const [actionType, setActionType] = useState<UserActionType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (type: UserActionType) => {
    setActionType(type);
    setIsModalOpen(true);
  };

  return (
    <div>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ cursor: "pointer" }}>
        <div className="p-4 border rounded-xl shadow bg-white flex flex-col gap-2">
          <h3 className="font-semibold">{member.display_name}</h3>
          <p className="text-sm text-gray-600">{member.email}</p>

          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={() => handleOpenModal(USER_ACTION.APPROVE)}
            >
              承認
            </button>
            <button
              className="px-3 py-1 bg-red-500 text-white rounded"
              onClick={() => handleOpenModal(USER_ACTION.REJECT)}
            >
              否認
            </button>
          </div>

          {actionType && (
            <ConfirmModal
              opened={isModalOpen}
              type={actionType}
              member={member}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
