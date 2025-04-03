'use client';

import { VideoCard } from './VideoCard';
import { Grid, Paper, Title } from '@mantine/core';

import { VideoType } from '@/app/types';

interface VideosPageTemplateProps {
  documents: VideoType[];
}

export function VideosPageTemplate({ documents }: VideosPageTemplateProps) {
  return (
    <Paper m="0 2rem">
      <Title order={1} p="1.25rem 0" style={{ borderBottom: '1px solid #888' }}>動画一覧</Title>

      <Paper>
        <Title order={2} p="1rem 0">プログラミング学習</Title>
        <Grid>
          {documents.map((document) => (
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={document.id + '_grid'}>
              <VideoCard video={document} />
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Paper>
  );
}
