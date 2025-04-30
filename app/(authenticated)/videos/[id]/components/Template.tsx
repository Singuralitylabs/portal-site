'use client';

import { VideoType } from '@/app/types';
import { Paper, AspectRatio, Button, Flex, Text, Grid, Divider } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';
import YouTube from 'react-youtube';

interface VideoDetailPageProps {
  video: VideoType;
}

export function VideoDetailPageTemplate({ video }: VideoDetailPageProps) {
  return (
    <Paper m="0.5rem 2rem">
      <PageTitle>{video.name}</PageTitle>
      <Paper p="1rem 0 0">
        <Flex justify="center">
          <div className="max-w-800 shadow-md rounded-b-md c">
            <div>
              {/* <AspectRatio ratio={16 / 9}> */}
                {/* <iframe
                  src={video.url}
                  title={video.name}
                  style={{ border: 0, padding: 0}}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                /> */}
                {/* <div>{video.url.replace(/https:\/\/www\.youtube\.com\/embed\/([^&]+)/, "$1")}</div> */}
                {/* <div>{String("https://www.youtube.com/embed/EjjHHt-oVKc?si=XewCAAVy8n32wlbM&utm_source=sinlab.future-tech-association.org#hello-coding-school-20250421").replace(/https:\/\/www\.youtube\.com\/embed\/([^&\?]+)/, "$1")}</div> */}
                {/* <div>{String("https://www.youtube.com/embed/EjjHHt-oVKc?si=XewCAAVy8n32wlbM&utm_source=sinlab.future-tech-association.org#hello-coding-school-20250421").replace(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/, "$1")}</div> */}
                {/* <div>{video.url}</div> */}
                <YouTube 
                  videoId={String("https://www.youtube.com/embed/EjjHHt-oVKc?si=XewCAAVy8n32wlbM&utm_source=sinlab.future-tech-association.org#hello-coding-school-20250421").replace(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/, "$1")}
                  title={video.name}
                  // opts={{width: '800', height: '450'}}
                  style={{ border: 0, padding: 0, margin: '0 auto', aspectRatio: "16 / 9", maxWidth: 800, width: "100%" }}
                />

              {/* </AspectRatio> */}
            </div>
            <div>
              <Flex gap="0.5rem" justify="flex-start" align="flex-start" direction="column" p="1rem 1rem">
                <Grid justify="space-between" align="center" columns={12} w="100%">
                  <Grid.Col span={6}>
                    <Button component="div" radius="md" size="compact-sm" c="rgb(23,23,23)" bg="gray.2" fs="0.875rem">
                      {video.category}
                    </Button>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Flex w="100%" justify="flex-end"><Text>担当：{video.assignee}</Text></Flex>
                  </Grid.Col>
                </Grid>
                <Flex w="100%" justify="flex-end"><Text>ビデオの長さ {Math.floor(video.length / 60)}:{(video.length % 60).toString().padStart(2, '0')}</Text></Flex>
              </Flex>
            </div>
            <Divider color="#999" m="0 1rem" />
            <div>
              <Flex gap="0.5rem" justify="flex-start" align="flex-start" direction="column" p="1rem 1rem">
                <Text component="div">■概要</Text>
                <Text component="div">{video.description}</Text>
              </Flex>
            </div>
          </div>
        </Flex>
      </Paper>
    </Paper>
  );
}