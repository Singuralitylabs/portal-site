'use client';

import { VideoCard } from './VideoCard';
import { Grid, Paper } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';

import { VideoWithCategoryType } from '@/app/types';

interface VideosPageTemplateProps {
  videos: VideoWithCategoryType[];
}

export function VideosPageTemplate({ videos }: VideosPageTemplateProps) {
  return (
    <Paper m="0 2rem">
      <PageTitle>動画一覧</PageTitle>

      <Paper>
        <Grid>
          {videos.map((video) => (
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={video.id + '_grid'}>
              <VideoCard video={video} />
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Paper>
  );
}
