'use server';

import { fetchSingleVideo } from '@/app/services/api/videos';
import { VideoDetailPageTemplate } from './components/Template';
import Link from 'next/link';

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: number }>
}) {
  const videoId: number = (await params).id;
  const { data, error } = await fetchSingleVideo(videoId);
  const videoData = data!.shift();

  if (error) {
    return <p>データを取得できませんでした。</p>;
  }

  if (videoData !== undefined) {
    return <VideoDetailPageTemplate video={videoData} />;
  } else {
    return (
      <div style={{margin: '0.5rem 4rem'}}>
        <div>動画データが見つかりませんでした。</div>
        <div><Link href="/videos">動画一覧</Link></div>
      </div>
    )
  }
}
