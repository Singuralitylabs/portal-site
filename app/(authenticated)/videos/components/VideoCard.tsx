'use client';

import { VideoWithCategoryType } from '@/app/types';
import { Button, Card, Text } from '@mantine/core';
import Image from 'next/image';
import { YoutubeVideoId } from '@/app/components/YoutubeVideoId';

interface VideoCardProps {
  video: VideoWithCategoryType;
}

export function VideoCard({ video }: VideoCardProps) {
  const VideoId = YoutubeVideoId({ url: video.url });
  const thumbnailUrl = video.thumbnail_path || (VideoId ? `https://img.youtube.com/vi/${VideoId}/hqdefault.jpg` : '/default_video_thumbnail.png');
  return (
    <Card component="a" href={`/videos/${video.id}`} shadow="sm" padding="0" radius="md" w="100%" withBorder className="hover:shadow-lg transition-shadow">
      <Card.Section>
        <div style={{ position: 'relative', margin: '0 auto', width: 'calc(12rem * 16 / 9)', height: 'calc(12rem - 2px)', aspectRatio: '16/9' }}>
          <Image
            src={video.thumbnail_path || 'https://img.youtube.com/vi/' + video.url.replace(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/, "$1") + '/hqdefault.jpg' || '/default_video_thumbnail.png'}
            alt={video.name}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      </Card.Section>
      <Card.Section p="md">
        <Text fw={700} size="lg" mb="xs">{video.name}</Text>
        <Text component="div" lineClamp={2} c="dimmed" mb="md">
          {video.description}
        </Text>
        <Button component="div" radius="md" size="compact-sm" c="rgb(23,23,23)" bg="gray.2" fs="0.875rem">
          {video.category?.name}
        </Button>
      </Card.Section>
    </Card>
  );
}
