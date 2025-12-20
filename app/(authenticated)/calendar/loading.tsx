import { PageTitle } from "@/app/components/PageTitle";

export default function CalendarPageLoading() {
  return (
    <>
      <PageTitle>シンラボカレンダー</PageTitle>
      <div
        className="p-4 mb-8 bg-white rounded-lg shadow-sm"
        role="status"
        aria-label="カレンダー読み込み中"
      >
        <span className="sr-only">読み込み中...</span>

        {/* Calendar header skeleton */}
        <div className="mb-4 flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded motion-safe:animate-pulse w-48"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded motion-safe:animate-pulse w-24"></div>
            <div className="h-10 bg-gray-200 rounded motion-safe:animate-pulse w-24"></div>
          </div>
        </div>

        {/* Calendar view toggle skeleton */}
        <div className="mb-4 flex gap-2">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-10 bg-gray-200 rounded motion-safe:animate-pulse w-20"
            ></div>
          ))}
        </div>

        {/* Calendar grid skeleton */}
        <div className="border rounded-lg overflow-hidden">
          {/* Week header */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {[...Array(7)].map((_, index) => (
              <div
                key={index}
                className="p-2 text-center border-r last:border-r-0"
              >
                <div className="h-4 bg-gray-200 rounded motion-safe:animate-pulse mx-auto w-8"></div>
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          {[...Array(5)].map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
              {[...Array(7)].map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="p-2 border-r last:border-r-0 min-h-24"
                >
                  <div className="h-4 bg-gray-200 rounded motion-safe:animate-pulse w-6 mb-2"></div>
                  <div className="space-y-1">
                    <div className="h-6 bg-gray-200 rounded motion-safe:animate-pulse w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
