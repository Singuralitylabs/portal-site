import { VideoCard } from "./VideoCard";
import { PageTitle } from "@/app/components/PageTitle";
import { SelectCategoryType, VideoWithCategoryType } from "@/app/types";
import CategoryLink from "@/app/(authenticated)/components/CategoryLink";
import ContentMgrNewButton from "@/app/(authenticated)/components/ContentMgrNewButton";

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

  return (
    <div className="p-4 overflow-x-hidden">
      <PageTitle>動画一覧</PageTitle>
      {isContentMgr && (
        <div className="mt-4 flex justify-end">
          <ContentMgrNewButton type="video" categories={categories} userId={userId}>
            新規登録
          </ContentMgrNewButton>
        </div>
      )}

      <div className="mb-4 py-4 flex flex-wrap items-center">
        <CategoryLink
          categories={existingCategories.map(category => ({
            id: category.id,
            name: category.name,
          }))}
        />
      </div>

      <div>
        {existingCategories.map(category => (
          <div key={category.id} className="mb-12">
            <h2 id={`category-${category.id}`}>{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {videos
                .filter(video => video.category?.name === category.name)
                .map(video => (
                  <div key={video.id} className="w-full">
                    <VideoCard
                      video={video}
                      isContentMgr={isContentMgr}
                      categories={categories}
                      userId={userId}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-left mt-8 mb-4">
        <a href="#" className="text-blue-600">
          TOPへ
        </a>
      </div>
    </div>
  );
}
