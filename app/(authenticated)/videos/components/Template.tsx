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
  return (
    <VideoCollection
      videos={videos}
      categories={categories}
      isContentMgr={isContentMgr}
      userId={userId}
    >
      <PageTitle>動画一覧</PageTitle>
    </VideoCollection>
  );
}
