'use server';
import { fetchVideos } from '@/app/services/api/videos';
import { VideoDetailPageTemplate } from './components/Template';

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ detail_page: number }>
}) {
  const video_detail_page_id: number = (await params).detail_page;
  const { data, error } = await fetchVideos();
  const video_data = Object(data.find(({ id }) => id === Number(video_detail_page_id)));

  if (error) {
    return <p>データを取得できませんでした。</p>;
  }

  return <VideoDetailPageTemplate video={video_data} />;
}
