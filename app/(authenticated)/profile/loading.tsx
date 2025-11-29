import { PageTitle } from "@/app/components/PageTitle";

export default function ProfilePageLoading() {
  return (
    <>
      <PageTitle>プロフィール</PageTitle>

      <div
        className="p-4 mb-8 bg-white rounded-lg shadow-sm"
        role="status"
        aria-label="プロフィール読み込み中"
      >
        <span className="sr-only">読み込み中...</span>
        <div className="mb-4">
          <div className="h-8 w-48 bg-gray-200 rounded motion-safe:animate-pulse mb-2"></div>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full motion-safe:animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded motion-safe:animate-pulse"></div>
          </div>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded motion-safe:animate-pulse mb-2"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded motion-safe:animate-pulse"></div>
      </div>

      <div className="p-4 mb-8 bg-white rounded-lg shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              名前
            </label>
            <div className="h-10 w-full bg-gray-200 rounded motion-safe:animate-pulse"></div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">
              自己紹介
            </label>
            <div className="h-24 w-full bg-gray-200 rounded motion-safe:animate-pulse"></div>
          </div>

          <div className="h-10 w-16 bg-gray-200 rounded motion-safe:animate-pulse"></div>
        </div>
      </div>
    </>
  );
}
