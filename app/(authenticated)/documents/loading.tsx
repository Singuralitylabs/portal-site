import { PageTitle } from "@/app/components/PageTitle";

export default function DocumentPageLoading() {
  return (
    <>
      <PageTitle>資料一覧</PageTitle>

      <div className="mb-4 py-4 flex flex-wrap items-center">
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      <div>
        {[...Array(2)].map((_, categoryIndex) => (
          <div key={categoryIndex} className="mb-12">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {[...Array(6)].map((_, documentIndex) => (
                <div key={documentIndex} className="w-full">
                  <div className="aspect-video bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
