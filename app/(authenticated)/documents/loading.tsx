import { PageTitle } from "@/app/components/PageTitle";
import { CategoryGridSkeleton } from "@/app/components/skeletons/CategoryGridSkeleton";

export default function DocumentPageLoading() {
  return (
    <>
      <PageTitle>資料一覧</PageTitle>
      <CategoryGridSkeleton ariaLabel="資料一覧読み込み中" />
    </>
  );
}
