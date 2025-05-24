'use client';

import { VideoType } from '@/app/types';
import { Paper, Button, Flex, Text, Grid, Divider } from '@mantine/core';
import { PageTitle } from '@/app/components/PageTitle';
import Link from 'next/link';
import YouTube from 'react-youtube';

interface VideoDetailPageProps {
  video: VideoType;
}

export function VideoDetailPageTemplate({ video }: VideoDetailPageProps) {
  return (
    <Paper m="0.5rem 2rem">
      <PageTitle>
        {video.name ? (video.name) : "Video Not Found"}
      </PageTitle>  
      <Paper p="1rem 0 0">
        <Flex justify="center">
          <div className="max-w-[800px] w-full shadow-md rounded-b-md">
            <div>
              <YouTube
                videoId={video.url.replace(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/, "$1")}
                title={video.name}
                opts={{
                  width: "100%",
                  height: "100%",
                }}
                className="mx-auto inset-0 max-w-[800px] aspect-video"
                iframeClassName="max-w-[800px] aspect-video"
              />
            </div>
            <div>
              <Flex gap="0.5rem" justify="flex-start" align="flex-start" direction="column" p="1rem 1rem">
                <Grid justify="space-between" align="center" columns={12} w="100%">
                  <Grid.Col span={6}>
                    {/* 動画のカテゴリー */}
                    <Button component="div" radius="md" size="compact-sm" c="rgb(23,23,23)" bg="gray.2" fs="0.875rem">
                      {video.category}
                    </Button>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    {/* 担当者情報 */}
                    {video.assignee && (
                      // 担当者情報ありの場合は表示する
                      <Flex w="100%" justify="flex-end">
                        <Text>担当：{video.assignee}</Text>
                      </Flex>
                    )}
                  </Grid.Col>
                </Grid>
                {/* 動画の長さ */}
                {video.length && (
                  // ビデオの長さ情報がある場合は表示する
                  <Flex w="100%" justify="flex-end">
                    <Text>ビデオの長さ {Math.floor(Number(video.length) / 60)}:{(Number(video.length) % 60).toString().padStart(2, '0')}</Text>
                  </Flex>
                )}
              </Flex>
            </div>
            <Divider color="#999" m="0 1rem" />
            <div>
              <Flex gap="0.5rem" justify="flex-start" align="flex-start" direction="column" p="1rem 1rem">
                <Text component="div">■概要</Text>
                <Text component="div">
                  {
                    String(video.description).split('\n')
                      .map((item, index) => {
                        return (
                          <div key={'description_' + index}>
                            {
                              // 概要欄の各行がURL形式かを判定する
                              URL.canParse(item) ? (
                                // 関連資料のURLがある場合は資料を別タブで開く
                                <Link href={item} rel="noopener noreferrer" target="_blank">{item}</Link>
                              ) : (
                                // 資料のURL等がない場合はテキストをそのまま表示する
                                item
                              )}
                            <br />{/* 改行コードはHTMLの<br />を挿入する */}
                          </div>
                        )
                      })
                  }
                </Text>
              </Flex>
            </div>
          </div>
        </Flex>
      </Paper>
    </Paper>
  );
}