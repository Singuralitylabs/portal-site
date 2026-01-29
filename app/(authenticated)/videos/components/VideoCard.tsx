"use client";

import { SelectCategoryType, VideoWithCategoryType } from "@/app/types";
import Image from "next/image";
import { getYouTubeVideoId } from "@/app/(authenticated)/videos/utils";
import { Card, Text } from "@mantine/core";
import ContentMgrMenu from "@/app/(authenticated)/components/ContentMgrMenu";
import { CONTENT_TYPE } from "@/app/constants/content";

interface VideoCardProps {
  video: VideoWithCategoryType;
  categories: SelectCategoryType[];
  isContentMgr: boolean;
  userId: number;
}

function getThumbnailUrl(video: VideoWithCategoryType): string {
  if (video.thumbnail_path) {
    return video.thumbnail_path;
  }

  const videoId = getYouTubeVideoId(video.url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  return "/default_video_thumbnail.png";
}

export function VideoCard({ video, isContentMgr, categories, userId }: VideoCardProps) {
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
            <ContentMgrMenu<VideoWithCategoryType>
              type={CONTENT_TYPE.VIDEO}
              content={video}
              categories={categories}
              userId={userId}
            />
          </div>
        )}
        <div className="aspect-video mx-auto" style={{ position: "relative" }}>
          <Image src={thumbnailUrl} alt={video.name} fill style={{ objectFit: "cover" }} />
        </div>
        <div className="p-4">
          <Text fw={700} size="lg" mb="xs" lineClamp={1}>
            {video.name}
          </Text>
          <Text component="div" lineClamp={2} c="dimmed" mb="md" className="prose prose-sm max-w-none">
            {video.description}
          </Text>
        </div>
      </Card.Section>
    </Card>
  );
}
