"use client";

import { UserActionType, PendingUserType } from "@/app/types";
import { Card, Text } from "@mantine/core";
import { useState } from "react";

import MemberActionModal from "@/app/(authenticated)/dashboard/components/MemberActionModal";
import { USER_ACTION } from "@/app/constants/user";

interface MemberActionCardProps {
  member: PendingUserType;
}

export function MemberActionCard({ member }: MemberActionCardProps) {
  const [actionType, setActionType] = useState<UserActionType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (type: UserActionType) => {
    setActionType(type);
    setIsModalOpen(true);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ cursor: "pointer" }}>
      <Text size="md" c="black">
        {member.display_name}
      </Text>
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
        <MemberActionModal
          opened={isModalOpen}
          type={actionType}
          member={member}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </Card>
  );
}
