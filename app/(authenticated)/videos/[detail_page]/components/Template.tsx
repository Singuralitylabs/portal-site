'use client';
import { VideoType } from '@/app/types';
import { Paper, AspectRatio, Button, Card, Flex, Text, Grid } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';

interface VideoDetailPageProps {
  video: VideoType;
}

export function VideoDetailPageTemplate({ video }: VideoDetailPageProps) {
  return (
    <Paper m="0.5rem 2rem">
      <PageTitle>{video.name}</PageTitle>
      <Paper p="1rem 0 0">
        <Flex justify="center">
          <Card component="div" shadow="sm" padding="lg" radius="md" maw={800} w="100%" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <AspectRatio ratio={16 / 9}>
                <iframe
                  src={video.url}
                  title={video.name}
                  style={{ border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </AspectRatio>
            </Card.Section>
            <Card.Section withBorder>
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
            </Card.Section>
            <Card.Section>
              <Flex gap="0.5rem" justify="flex-start" align="flex-start" direction="column" p="1rem 1rem">
                <Text component="div">■概要</Text>
                <Text component="div">{video.description}</Text>
              </Flex>
            </Card.Section>
          </Card>
        </Flex>
      </Paper>
    </Paper>
  );
}