import { PageTitle } from "@/app/components/PageTitle";
import { CategoryGridSkeleton } from "@/app/components/skeletons/CategoryGridSkeleton";

export default function VideoPageLoading() {
  return (
    <>
      <PageTitle>動画一覧</PageTitle>
      <CategoryGridSkeleton ariaLabel="動画一覧読み込み中" />
    </>
  );
}
