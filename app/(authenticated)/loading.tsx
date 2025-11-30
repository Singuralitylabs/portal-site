export default function HomeLoading() {
  return (
    <div role="status" aria-label="トップページ読み込み中">
      <span className="sr-only">読み込み中...</span>

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* ヘッダーエリア */}
          <div className="text-center px-4 sm:px-6 md:px-8">
            <div className="h-10 w-96 max-w-full bg-gray-200 rounded motion-safe:animate-pulse mb-6 mx-auto"></div>
            <div className="h-6 w-full sm:w-2xl max-w-2xl bg-gray-200 rounded motion-safe:animate-pulse mb-2 mx-auto"></div>
            <div className="h-6 w-3/4 sm:w-xl max-w-xl bg-gray-200 rounded motion-safe:animate-pulse mx-auto"></div>
          </div>

          {/* カードグリッド */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={`card-${i}`} className="bg-card p-6 rounded-lg shadow-lg">
                <div className="h-7 w-32 bg-gray-200 rounded motion-safe:animate-pulse mb-4"></div>
                <div className="space-y-2">
                  <div className="h-5 w-full bg-gray-200 rounded motion-safe:animate-pulse"></div>
                  <div className="h-5 w-4/5 bg-gray-200 rounded motion-safe:animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
