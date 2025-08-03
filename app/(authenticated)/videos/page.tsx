import { fetchVideos } from '@/app/services/api/videos';
import { fetchCategoriesByType } from '@/app/services/api/categories';
import { VideosPageTemplate } from './components/Template';

export default async function VideosPage() {
  const { data, error } = await fetchVideos();
  const { data:dataCategory, error:errorCategory } = await fetchCategoriesByType("videos");

  if (error || errorCategory) {
    return <p>データを取得できませんでした。</p>;
  }

  return <VideosPageTemplate videos={data} categories={dataCategory} />;
}
