"use client";

import { VideoWithCategoryType } from "@/app/types";
import Image from "next/image";
import { getYouTubeVideoId } from "@/app/(authenticated)/videos/utils";
import { Card, Button, Group, Text } from "@mantine/core";

interface VideoCardProps {
  video: VideoWithCategoryType;
  isContentMgr: boolean; // Note: This represents content management permissions (admin OR maintainer)
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
      w="100%"
      withBorder
      className="hover:shadow-lg transition-shadow"
    >
      <Card.Section component="a" href={`/videos/${video.id}`}>
        <div className="aspect-video mx-auto" style={{ position: "relative" }}>
          <Image src={thumbnailUrl} alt={video.name} fill style={{ objectFit: "cover" }} />
        </div>
        <div className="p-4">
          <Text fw={700} size="lg" mb="xs">
            {video.name}
          </Text>
          <Text component="div" lineClamp={2} c="dimmed" mb="md">
            {video.description}
          </Text>
          <Button
            component="div"
            radius="md"
            size="compact-sm"
            c="rgb(23,23,23)"
            bg="gray.2"
            fs="0.875rem"
          >
            {video.category?.name}
          </Button>
        </div>
      </Card.Section>
      <Card.Section>
        {isContentMgr && (
          <Group m="0 1rem 1rem" gap="xs">
            <Button color="blue" onClick={() => onEdit(video)}>
              編集
            </Button>
            <Button color="red" onClick={() => onDelete(video.id)}>
              削除
            </Button>
          </Group>
        )}
      </Card.Section>
    </Card>
  );
}
