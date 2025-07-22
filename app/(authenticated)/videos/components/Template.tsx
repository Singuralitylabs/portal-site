'use client';

import { useState } from 'react';
import { VideoCard } from './VideoCard';
import { VideoForm } from './VideoForm';
import { Grid, Paper, Button, Flex, Modal } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';

import { VideoWithCategoryType } from '@/app/types';
import { CategoryType } from '@/app/types';

interface VideosPageTemplateProps {
  videos: VideoWithCategoryType[];
  categories: CategoryType[];
}

export function VideosPageTemplate({ videos, categories }: VideosPageTemplateProps) {
  const [opened, setOpened] = useState(false);

  // category_typeが'videos'のカテゴリのみ抽出
  const videoCategories = categories.filter((category) => category.category_type === 'videos');
  const videoCategoryNames = new Set(
    videos
      .map((video) => video.category?.name)
      .filter((name) => videoCategories.some((cat) => cat.name === name))
  );
  const existingCategories = videoCategories.filter((category) => videoCategoryNames.has(category.name));
  const handleOpenModal = () => setOpened(true);

  return (
    <Paper m="0 2rem">
      <Flex justify="space-between" align="center" mb="md">
        <PageTitle>動画一覧</PageTitle>
        <Button onClick={handleOpenModal}>
          新規作成
        </Button>
      </Flex>
      <Modal opened={opened} onClose={() => setOpened(false)}>
        <VideoForm
          categories={videoCategories} // カテゴリー情報
          onSuccess={() => setOpened(false)}
          onClose={() => setOpened(false)}
        />
      </Modal>
      <Paper>
        {existingCategories.map((category) => (
          <div key={category.id}>
            <h2>{category.name}</h2>
            <Grid>
              {videos.filter((video) => video.category?.name === category.name)
                .map((video) => (
                  <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={video.id + '_grid'}>
                    <VideoCard video={video} />
                  </Grid.Col>
                ))}
            </Grid>
            <br />
          </div>
        ))}
      </Paper>
    </Paper>
  );
}
