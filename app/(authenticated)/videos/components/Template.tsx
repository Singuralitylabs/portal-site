import { VideoCard } from "./VideoCard";
import { VideoCollection } from "./VideoCollection";
import { PageTitle } from "@/app/components/PageTitle";
import { SelectCategoryType, VideoWithCategoryType } from "@/app/types";

interface VideosPageTemplateProps {
  videos: VideoWithCategoryType[];
  categories: SelectCategoryType[];
  isContentMgr: boolean;
  userId: number;
}

export function VideosPageTemplate({
  videos,
  categories,
  isContentMgr,
  userId,
}: VideosPageTemplateProps) {
  const videoCategoryNames = new Set(videos.map(video => video.category?.name));
  const existingCategories = categories.filter(category => videoCategoryNames.has(category.name));
  const sections = existingCategories.map(category => {
    const categoryVideos = videos.filter(video => video.category?.name === category.name);
    return {
      category,
      videos: categoryVideos,
      cards: categoryVideos.map(video => (
        <div key={video.id} className="w-full">
          <VideoCard
            video={video}
            isContentMgr={isContentMgr}
            categories={categories}
            userId={userId}
          />
        </div>
      )),
    };
  });

  return (
    <VideoCollection
      sections={sections}
      categories={categories}
      isContentMgr={isContentMgr}
      userId={userId}
    >
      <PageTitle>動画一覧</PageTitle>
    </VideoCollection>
  );
}
