import { PageTitle } from "@/app/components/PageTitle";

export default function MembersPageLoading() {
  return (
    <>
      <PageTitle>シンラボ会員一覧</PageTitle>
      <div
        className="p-4 mb-8 bg-white rounded-lg shadow-sm"
        role="status"
        aria-label="会員一覧読み込み中"
      >
        <span className="sr-only">読み込み中...</span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8 mt-4 px-4">
          {[...Array(12)].map((_, memberIndex) => (
            <div key={memberIndex} className="w-full">
              <div className="aspect-video bg-gray-200 rounded-lg motion-safe:animate-pulse mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
