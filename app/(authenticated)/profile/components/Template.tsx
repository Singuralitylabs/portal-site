"use client";

import { PageTitle } from "@/app/components/PageTitle";
import { Avatar, Button, Group, MultiSelect, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { User } from "lucide-react";
import { useState, useEffect, useTransition, useRef } from "react";
import { PositionType, ProfileUserType } from "@/app/types";
import { validateUrls } from "@/app/utils/url-validation";
import { createClientSupabaseClient } from "@/app/services/api/supabase-client";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const MAX_FILE_SIZE = 1024 * 1024;

interface ProfilePageTemplateProps {
  initialUser: ProfileUserType;
  allPositions: PositionType[];
  initialPositionIds: number[];
  updateProfile: (
    displayName: string,
    bio: string,
    positionIds: number[],
    x_url: string | null,
    facebook_url: string | null,
    instagram_url: string | null,
    github_url: string | null,
    portfolio_url: string | null
  ) => Promise<{ success: boolean; message?: string }>;
}

export function ProfilePageTemplate({
  initialUser,
  allPositions,
  initialPositionIds,
  updateProfile,
}: ProfilePageTemplateProps) {
  const [user, setUser] = useState<ProfileUserType>(initialUser);
  const [name, setName] = useState(initialUser.display_name);
  const [bio, setBio] = useState(initialUser.bio || "");
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>(initialPositionIds);
  const [x_url, setXUrl] = useState(initialUser.x_url || "");
  const [facebook_url, setFacebookUrl] = useState(initialUser.facebook_url || "");
  const [instagram_url, setInstagramUrl] = useState(initialUser.instagram_url || "");
  const [github_url, setGithubUrl] = useState(initialUser.github_url || "");
  const [portfolio_url, setPortfolioUrl] = useState(initialUser.portfolio_url || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const [profileImagePath, setProfileImagePath] = useState<string | null>(
    initialUser.profile_image_path ?? null
  );
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUser(initialUser);
    setName(initialUser.display_name);
    setBio(initialUser.bio || "");
    setSelectedPositionIds(initialPositionIds);
    setXUrl(initialUser.x_url || "");
    setFacebookUrl(initialUser.facebook_url || "");
    setInstagramUrl(initialUser.instagram_url || "");
    setGithubUrl(initialUser.github_url || "");
    setPortfolioUrl(initialUser.portfolio_url || "");
    setErrors({});
  }, [initialUser, initialPositionIds]);

  useEffect(() => {
    if (!profileImagePath) {
      setProfileImageUrl(null);
      return;
    }
    const supabase = createClientSupabaseClient();
    supabase.storage
      .from("profile-images")
      .createSignedUrl(profileImagePath, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) {
          setProfileImageUrl(`${data.signedUrl}&t=${Date.now()}`);
        }
      });
  }, [profileImagePath]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      notifications.show({
        title: "エラー",
        message: "ファイルサイズは1MB以下にしてください",
        color: "red",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      notifications.show({
        title: "エラー",
        message: "jpg / jpeg / png / gif のみアップロード可能です",
        color: "red",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsImageLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/profile/image", { method: "POST", body: formData });
    const data = await response.json();

    if (data.success) {
      setProfileImagePath(data.profile_image_path);
      notifications.show({
        title: "成功",
        message: "プロフィール画像を更新しました",
        color: "green",
        autoClose: 3000,
      });
    } else {
      notifications.show({
        title: "エラー",
        message: data.error || "画像のアップロードに失敗しました",
        color: "red",
        autoClose: 3000,
      });
    }

    setIsImageLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageDelete = async () => {
    setIsImageLoading(true);
    const response = await fetch("/api/profile/image", { method: "DELETE" });
    const data = await response.json();

    if (data.success) {
      setProfileImagePath(null);
      setProfileImageUrl(null);
      notifications.show({
        title: "成功",
        message: "プロフィール画像を削除しました",
        color: "green",
        autoClose: 3000,
      });
    } else {
      notifications.show({
        title: "エラー",
        message: data.error || "画像の削除に失敗しました",
        color: "red",
        autoClose: 3000,
      });
    }
    setIsImageLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const urlData = { x_url, facebook_url, instagram_url, github_url, portfolio_url };
    const invalidFields = validateUrls(urlData);

    if (invalidFields.length > 0) {
      const newErrors: Record<string, string> = {};
      const urlErrorMessage =
        "URLは https:// から始まる正しい形式で入力してください。無ければ空欄にしてください。";
      invalidFields.forEach(field => {
        newErrors[field] = urlErrorMessage;
      });
      setErrors(newErrors);

      const fieldLabels: Record<string, string> = {
        x_url: "X_URL",
        facebook_url: "Facebook_URL",
        instagram_url: "Instagram_URL",
        github_url: "GitHub_URL",
        portfolio_url: "ポートフォリオのURL",
      };
      const invalidLabels = invalidFields.map(field => fieldLabels[field] || field);
      const errorMessage = (
        <>
          次のフィールドに無効なURLが含まれています:
          <br />
          {invalidLabels.join(", ")}
        </>
      );
      notifications.show({ title: "入力エラー", message: errorMessage, color: "red" });
      return;
    }

    setErrors({});

    startTransition(async () => {
      const { success, message } = await updateProfile(
        name,
        bio,
        selectedPositionIds,
        x_url || null,
        facebook_url || null,
        instagram_url || null,
        github_url || null,
        portfolio_url || null
      );

      if (success) {
        setUser({
          ...user,
          display_name: name,
          bio,
          x_url,
          facebook_url,
          instagram_url,
          github_url,
          portfolio_url,
        });
        notifications.show({
          title: "成功",
          message: "プロフィールを更新しました",
          color: "green",
          autoClose: 3000,
        });
      } else {
        console.error("プロフィール更新エラー:", message);
        notifications.show({
          title: "エラー",
          message: message || "プロフィールの更新に失敗しました",
          color: "red",
          autoClose: 3000,
        });
      }
    });
  };

  const avatarSrc = profileImageUrl ?? user.avatar_url ?? null;
  const initial = user.display_name.charAt(0) || null;

  return (
    <>
      <PageTitle>プロフィール</PageTitle>

      {/* プロフィール情報表示 */}
      <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarSrc}
            size={80}
            radius="xl"
            imageProps={{ referrerPolicy: "no-referrer" }}
          >
            {initial ?? <User size={32} />}
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{user.display_name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-gray-200 px-3 py-1 rounded-full text-sm">{user.role}</span>
              <span className="text-sm text-gray-600">
                {(() => {
                  const date = new Date(user.created_at);
                  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                })()}{" "}
                に参加
              </span>
            </div>
          </div>
        </div>

        {/* 画像操作ボタン */}
        <Group mt="sm" gap="xs">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <Button
            variant="outline"
            size="xs"
            loading={isImageLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            画像を変更
          </Button>
          {profileImagePath && (
            <Button
              variant="outline"
              color="red"
              size="xs"
              loading={isImageLoading}
              onClick={handleImageDelete}
            >
              画像を削除
            </Button>
          )}
        </Group>
      </div>

      {/* プロフィール編集フォーム */}
      <div className="p-4 mb-8 bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                名前
              </label>
              <TextInput id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <MultiSelect
                label="活動チーム、役割など"
                data={allPositions.map(p => ({ value: String(p.id), label: p.name }))}
                value={selectedPositionIds.map(String)}
                onChange={values => setSelectedPositionIds(values.map(Number))}
                placeholder="選択してください"
                clearable
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                自己紹介
              </label>
              <Textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                autosize
                minRows={5}
                maxRows={10}
              />
            </div>

            <div>
              <label htmlFor="x_url" className="block text-sm font-medium mb-1">
                X URL
              </label>
              <TextInput
                id="x_url"
                placeholder="https://x.com/..."
                value={x_url}
                onChange={e => setXUrl(e.target.value)}
                error={errors.x_url}
              />
            </div>

            <div>
              <label htmlFor="facebook_url" className="block text-sm font-medium mb-1">
                Facebook URL
              </label>
              <TextInput
                id="facebook_url"
                placeholder="https://facebook.com/..."
                value={facebook_url}
                onChange={e => setFacebookUrl(e.target.value)}
                error={errors.facebook_url}
              />
            </div>

            <div>
              <label htmlFor="instagram_url" className="block text-sm font-medium mb-1">
                Instagram URL
              </label>
              <TextInput
                id="instagram_url"
                placeholder="https://instagram.com/..."
                value={instagram_url}
                onChange={e => setInstagramUrl(e.target.value)}
                error={errors.instagram_url}
              />
            </div>

            <div>
              <label htmlFor="github_url" className="block text-sm font-medium mb-1">
                GitHub URL
              </label>
              <TextInput
                id="github_url"
                placeholder="https://github.com/..."
                value={github_url}
                onChange={e => setGithubUrl(e.target.value)}
                error={errors.github_url}
              />
            </div>

            <div>
              <label htmlFor="portfolio_url" className="block text-sm font-medium mb-1">
                ポートフォリオサイトのURL
              </label>
              <TextInput
                id="portfolio_url"
                placeholder="https://your-portfolio.com/..."
                value={portfolio_url}
                onChange={e => setPortfolioUrl(e.target.value)}
                error={errors.portfolio_url}
              />
            </div>

            <Button type="submit" loading={isPending}>
              保存
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
