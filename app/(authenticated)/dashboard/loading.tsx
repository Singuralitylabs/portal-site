import { PageTitle } from "@/app/components/PageTitle";

export default function DashboardPageLoading() {
  return (
    <>
      <PageTitle>ダッシュボード</PageTitle>
      <div className="p-4 overflow-x-hidden">
        <h2 className="scroll-mt-40">承認管理</h2>
        <div role="status" aria-label="承認待ちユーザー読み込み中">
          <span className="sr-only">読み込み中...</span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8 mt-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="w-full">
                <div className="p-4 border rounded-xl shadow bg-white">
                  <div className="h-6 bg-gray-200 rounded motion-safe:animate-pulse mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded motion-safe:animate-pulse mb-4 w-full"></div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-8 bg-gray-200 rounded motion-safe:animate-pulse w-20"></div>
                    <div className="h-8 bg-gray-200 rounded motion-safe:animate-pulse w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
