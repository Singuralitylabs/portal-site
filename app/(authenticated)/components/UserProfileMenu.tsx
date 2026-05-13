"use client";

import { Menu, Avatar, Skeleton, UnstyledButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/app/services/api/supabase-client";
import { useSupabaseAuth } from "@/app/providers/supabase-auth-provider";
import { useProfileImage } from "@/app/providers/profile-image-provider";

export function UserProfileMenu() {
  const { user, loading } = useSupabaseAuth();
  const { profileImageUrl } = useProfileImage();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClientSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      notifications.show({
        color: "red",
        title: "ログアウトに失敗しました",
        message: "時間をおいて再度お試しください。",
      });
      return;
    }
    router.push("/login");
  };

  const googleAvatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const avatarSrc = profileImageUrl ?? googleAvatarUrl;
  const displayName: string = user?.user_metadata?.full_name ?? "";
  const initial = displayName.charAt(0) || null;

  if (loading) {
    return <Skeleton circle height={32} />;
  }

  return (
    <Menu position="bottom-end" shadow="md" width={160}>
      <Menu.Target>
        <UnstyledButton aria-label="ユーザーメニュー">
          <Avatar
            src={avatarSrc}
            size="sm"
            radius="xl"
            imageProps={{ referrerPolicy: "no-referrer" }}
          >
            {initial ?? <User size={16} />}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<User size={14} />} onClick={() => router.push("/profile")}>
          プロフィール
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<LogOut size={14} />} color="red" onClick={handleSignOut}>
          ログアウト
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
