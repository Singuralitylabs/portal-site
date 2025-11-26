"use client";

import { ApproveAction, MemberAdminType } from "@/app/types";
import { Card, Avatar, Text, Group } from "@mantine/core";
import { useState } from "react";

import ConfirmModal from "@/app/(authenticated)/dashboard/components/ConfirmModal";

interface MemberAdminCardProps {
    member: MemberAdminType;
    adminId: number;
}

export function MemberApprovalCard({ member, adminId }: MemberAdminCardProps) {
    const [modalType, setModalType] = useState<ApproveAction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const avatarContent = member.display_name.charAt(0).toUpperCase();

    // モーダルにセット
    const handleOpenModal = (type: ApproveAction) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    return (
        <div>
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ cursor: "pointer" }}
            >
                <Group align="flex-start" gap="sm">
                    <Avatar src={member.avatar_url} color="blue" radius="xl">
                        {!member.avatar_url && avatarContent}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                        <Text fw={500} size="lg" mb={4}>
                            {member.display_name}
                        </Text>
                        <Text size="sm" c="dimmed" lineClamp={3} style={{ minHeight: "4.5em" }}>
                            {member.bio || ""}
                        </Text>
                    </div>
                </Group>
                <div className="p-4 border rounded-xl shadow bg-white flex flex-col gap-2">
                    <h3 className="font-semibold">{member.display_name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>

                    <div className="flex gap-2 mt-2">
                        <button
                            className="px-3 py-1 bg-blue-500 text-white rounded"
                            onClick={() => handleOpenModal("approve")}
                        >
                            承認
                        </button>
                        <button
                            className="px-3 py-1 bg-yellow-500 text-white rounded"
                            onClick={() => handleOpenModal("reject")}
                        >
                            否認
                        </button>
                        <button
                            className="px-3 py-1 bg-red-500 text-white rounded"
                            onClick={() => handleOpenModal("delete")}
                        >
                            削除
                        </button>
                    </div>

                    {modalType && (
                        <ConfirmModal
                            open={isModalOpen}
                            type={modalType}
                            member={member}
                            adminId={adminId}
                            onClose={() => setIsModalOpen(false)}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}