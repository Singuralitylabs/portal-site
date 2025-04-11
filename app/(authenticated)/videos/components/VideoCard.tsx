'use client';

import { VideoType } from '@/app/types';
import { Button, Card, Flex, Text } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';

interface VideoCardProps {
  video: VideoType;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card component="a" href={`/videos/${video.id}`} shadow="sm" padding="0" radius="md" w="100%" withBorder className="hover:shadow-lg transition-shadow">
      <Card.Section>
        <div style={{ position: 'relative', width: '100%', height: '12rem' }}>
          <Image
            src={video.thumbnail || video.url}
            alt={video.name}
            fill
            style={{ objectFit: 'cover', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
          />
        </div>
      </Card.Section>
      <Card.Section p="md">
        <Text fw={700} size="lg" mb="xs">{video.name}</Text>
        <Text component="div" lineClamp={2} c="dimmed" mb="md">
          {video.description}
        </Text>
        <Button component="div" radius="md" size="compact-sm" c="rgb(23,23,23)" bg="gray.2" fs="0.875rem">
          {video.category}
        </Button>
      </Card.Section>
    </Card>
  );
}
