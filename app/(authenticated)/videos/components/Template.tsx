'use client';

import { VideoCard } from './VideoCard';
import { Grid, Paper, Title } from '@mantine/core';

import { VideoType } from '@/app/types';

interface VideosPageTemplateProps {
  videos: VideoType[];
}

export function VideosPageTemplate({ videos }: VideosPageTemplateProps) {
  return (
    <Paper m="0 2rem">
      <Title order={1} p="1.25rem 0" style={{ borderBottom: '1px solid #888' }}>動画一覧</Title>

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
