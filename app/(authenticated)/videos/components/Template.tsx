'use client';

import { VideoCard } from './VideoCard';
import { Grid, Paper } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';

import { VideoWithCategoryType } from '@/app/types';
import { CategoryType } from '@/app/types';

interface VideosPageTemplateProps {
  videos: VideoWithCategoryType[];
  categories: CategoryType[];
}

export function VideosPageTemplate({ videos, categories }: VideosPageTemplateProps) {
  const videoCategoryNames = new Set(videos.map((video) => video.category?.name));
  const existingCategories = categories.filter((category) => videoCategoryNames.has(category.name));

  return (
    <Paper m="0 2rem">
      <PageTitle>動画一覧</PageTitle>

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
            <br/>
          </div>
        ))}
      </Paper>
    </Paper>
  );
}
