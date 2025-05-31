import { fetchVideos } from '@/app/services/api/videos';
import { VideosPageTemplate } from './components/Template';

export default async function VideosPage() {
  const { data, error } = await fetchVideos();

  if (error) {
    return <p>データを取得できませんでした。</p>;
  }

  return <VideosPageTemplate videos={data} />;
}
