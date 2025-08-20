'use client';

import { useState } from 'react';
import { VideoCard } from './VideoCard';
import { Grid, Paper, Button, Group } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';
import { VideoFormModal } from './VideoFormModal';
import { VideoWithCategoryType, CategoryType } from '@/app/types';

interface VideosPageTemplateProps {
  videos: VideoWithCategoryType[];
  categories: CategoryType[];
  currentUserRole: string;
  userId: number;
};

export function VideosPageTemplate({ videos, categories, currentUserRole, userId }: VideosPageTemplateProps) {
  const videoCategoryNames = new Set(videos.map((video) => video.category?.name));
  const existingCategories = categories.filter((category) => videoCategoryNames.has(category.name));

  const [modalOpened, setModalOpened] = useState(false);
  const isAdmin = currentUserRole === 'admin';

  return (
    <Paper m="0 2rem">
      <Group justify="space-between" align="center" mb="md">
        <PageTitle>動画一覧</PageTitle>
        {isAdmin && (
          <Button onClick={() => setModalOpened(true)} color="blue">
            新規登録
          </Button>
        )}
      </Group>

      <VideoFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        categories={categories}
        userId={userId}
      />

      <Paper mb="md" p="md">
        <div className="flex flex-wrap items-center">
          {existingCategories.map((category) => (
            <div key={category.id}>
              <a href={`#category-${category.id}`} className="text-blue-600 mr-4">{category.name}</a>
            </div>
          ))}
        </div>
      </Paper>

      <Paper>
        {existingCategories.map((category) => (
          <div key={category.id}>
            <h2 id={`category-${category.id}`}>{category.name}</h2>
            <Grid>
              {videos.filter((video) => video.category?.name === category.name)
                .map((video) => (
                  <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={video.id + '_grid'}>
                    <VideoCard
                      video={video}
                      isAdmin={isAdmin}
                      categories={categories}
                      userId={userId}
                    />
                  </Grid.Col>
                ))}
            </Grid>
          </div>
        ))}
      </Paper>

      <div className="text-left mt-8 mb-4 ml-6">
        <a href="#" className="text-blue-600">
          TOPへ
        </a>
      </div>
    </Paper>
  );
}
