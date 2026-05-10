"use client";

import { Menu, Avatar, Skeleton, UnstyledButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/app/services/api/supabase-client";
import { useSupabaseAuth } from "@/app/providers/supabase-auth-provider";
import { useEffect, useState } from "react";

export function UserProfileMenu() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const supabase = createClientSupabaseClient();
    supabase
      .from("users")
      .select("profile_image_path")
      .eq("auth_id", user.id)
      .eq("is_deleted", false)
      .maybeSingle()
      .then(({ data }) => {
        const path = data?.profile_image_path;
        if (!path) return;

        supabase.storage
          .from("profile-images")
          .createSignedUrl(path, 3600)
          .then(({ data: urlData }) => {
            if (urlData?.signedUrl) {
              setProfileImageUrl(`${urlData.signedUrl}&t=${Date.now()}`);
            }
          });
      });
  }, [user]);

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
