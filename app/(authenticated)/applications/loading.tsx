import { PageTitle } from "@/app/components/PageTitle";
import { CategoryGridSkeleton } from "@/app/components/skeletons/CategoryGridSkeleton";

export default function ApplicationPageLoading() {
  return (
    <>
      <PageTitle>アプリ紹介</PageTitle>
      <CategoryGridSkeleton ariaLabel="アプリ一覧読み込み中" />
    </>
  );
}
