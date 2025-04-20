'use server';

import { fetchVideos } from '@/app/services/api/videos';
import { VideoDetailPageTemplate } from './components/Template';

export default async function VideoDetailPage({
  params,
}: {
  params: { id: number }
}) {
  const video_id: number = (await params).id;
  const { data, error } = await fetchVideos();
  const video_data = Object(data.find(({ id }) => id === Number(video_id)));

  if (error) {
    return <p>データを取得できませんでした。</p>;
  }

  return <VideoDetailPageTemplate video={video_data} />;
}
