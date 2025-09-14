"use client";

import { VideoWithCategoryType } from "@/app/types";
import Image from "next/image";
import { getYouTubeVideoId } from "@/app/(authenticated)/videos/utils";
import { EllipsisVertical } from "lucide-react";
import { Card, Button, Menu, Text } from "@mantine/core";

interface VideoCardProps {
  video: VideoWithCategoryType;
  isContentMgr: boolean;
  onEdit: (video: VideoWithCategoryType) => void;
  onDelete: (videoId: number) => void;
}

function getThumbnailUrl(video: VideoWithCategoryType): string {
  if (video.thumbnail_path) {
    return video.thumbnail_path;
  }

  const videoId = getYouTubeVideoId({ url: video.url });
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  return "/default_video_thumbnail.png";
}

export function VideoCard({ video, isContentMgr, onEdit, onDelete }: VideoCardProps) {
  const thumbnailUrl = getThumbnailUrl(video);
  return (
    <Card
      shadow="sm"
      padding="0"
      radius="md"
      withBorder
      className="hover:shadow-lg transition-shadow w-full aspect-square"
    >
      <Card.Section component="a" href={`/videos/${video.id}`}>
        {isContentMgr && (
          <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
            <Menu>
              <Menu.Target>
                <Button
                  variant="subtle"
                  size="compact-xs"
                  p="4px"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation(); // これで動画詳細ページ遷移のクリックイベントを防止
                  }}
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    borderRadius: "4px",
                  }}
                >
                  <EllipsisVertical size={16} />
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(video);
                  }}
                >
                  編集
                </Menu.Item>
                <Menu.Item
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(video.id);
                  }}
                >
                  削除
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        )}
        <div className="aspect-video mx-auto" style={{ position: "relative" }}>
          <Image src={thumbnailUrl} alt={video.name} fill style={{ objectFit: "cover" }} />
        </div>
        <div className="p-4">
          <Text fw={700} size="lg" mb="xs" lineClamp={1}>
            {video.name}
          </Text>
          <Text component="div" lineClamp={2} c="dimmed" mb="md">
            {video.description}
          </Text>
        </div>
      </Card.Section>
    </Card>
  );
}
