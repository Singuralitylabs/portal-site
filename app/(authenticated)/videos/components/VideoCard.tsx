'use client';

import { useState } from 'react';
import { Card, Button, Group, Text, Flex, Modal } from '@mantine/core';
import { Calendar } from 'lucide-react';
import { VideoWithCategoryType, CategoryType } from '@/app/types';
import { deleteVideo } from '@/app/services/api/video-client';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { VideoFormModal } from './VideoFormModal';
import Image from 'next/image';
import { getYouTubeVideoId } from '@/app/(authenticated)/videos/utils';

interface VideoCardProps {
  video: VideoWithCategoryType;
  currentUserRole: string;
  categories: CategoryType[];
  userId: number;
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

export function VideoCard({ video, currentUserRole, categories, userId }: VideoCardProps) {
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const router = useRouter();
  const isAdmin = currentUserRole === 'admin';

  const handleDelete = async (id: number) => {
    try {
      const result = await deleteVideo(id);
      setDeleteModalOpened(false);
      if (result?.success) {
        notifications.show({
          title: '削除完了',
          message: '動画を削除しました。',
          color: 'green',
        });
        router.refresh();
      } else {
        notifications.show({
          title: '削除失敗',
          message: String(result?.error) || '不明なエラー',
          color: 'red',
        });
      }
    } catch (e) {
      setDeleteModalOpened(false);
      notifications.show({
        title: 'エラー',
        message: '削除処理で予期しないエラーが発生しました',
        color: 'red',
      });
      console.error(e);
    }
  };

  const thumbnailUrl = getThumbnailUrl(video);
  return (
    <Card component="a" href={`/videos/${video.id}`} shadow="sm" padding="0" radius="md" w="100%" withBorder className="hover:shadow-lg transition-shadow">
      <Card.Section>
        <div className="aspect-video mx-auto" style={{ position: 'relative' }}>
          <Image
            src={thumbnailUrl}
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
        {isAdmin && (
          <Group m="0 1rem 1rem" gap="xs">
            <Button color="blue" onClick={() => setEditModalOpened(true)}>
              編集
            </Button>
            <Button color="red" onClick={() => setDeleteModalOpened(true)}>
              削除
            </Button>
          </Group>
        )}
      </Card.Section>
      {/* 編集モーダル */}
      <VideoFormModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          router.refresh();
        }}
        categories={categories}
        userId={userId}
        initialData={video}
      />
      {/* 削除モーダル */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="削除の確認"
        centered
      >
        <Text mb="md">本当にこの動画を削除しますか？</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpened(false)}>
            キャンセル
          </Button>
          <Button color="red" onClick={() => handleDelete(video.id)}>
            削除
          </Button>
        </Group>
      </Modal>
    </Card>
  );
}
