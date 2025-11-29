interface CategoryGridSkeletonProps {
  /**
   * フィルタースケルトンの数
   * @default 4
   */
  filterCount?: number;
  /**
   * カテゴリの数
   * @default 2
   */
  categoryCount?: number;
  /**
   * カテゴリあたりのアイテム数
   * @default 6
   */
  itemsPerCategory?: number;
  /**
   * アクセシビリティ用のラベル
   */
  ariaLabel?: string;
}

/**
 * カテゴリ別グリッド表示用のローディングスケルトン
 *
 * フィルターエリアとカテゴリ別のグリッドアイテムを表示します。
 * applications, videos, documentsページで使用されています。
 */
export function CategoryGridSkeleton({
  filterCount = 4,
  categoryCount = 2,
  itemsPerCategory = 6,
  ariaLabel = "コンテンツ読み込み中",
}: CategoryGridSkeletonProps) {
  return (
    <div role="status" aria-label={ariaLabel}>
      <span className="sr-only">読み込み中...</span>

      {/* フィルターエリア */}
      <div className="mb-4 py-4 flex flex-wrap items-center">
        <div className="flex gap-2">
          {[...Array(filterCount)].map((_, i) => (
            <div
              key={`filter-${i}`}
              className="h-8 w-16 bg-gray-200 rounded motion-safe:animate-pulse"
            ></div>
          ))}
        </div>
      </div>

      {/* カテゴリ別グリッド */}
      <div>
        {[...Array(categoryCount)].map((_, categoryIndex) => (
          <div key={`category-${categoryIndex}`} className="mb-12">
            {/* カテゴリタイトルスケルトン */}
            <div className="h-8 w-32 bg-gray-200 rounded motion-safe:animate-pulse mb-4"></div>

            {/* グリッドアイテム */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {[...Array(itemsPerCategory)].map((_, itemIndex) => (
                <div key={`item-${categoryIndex}-${itemIndex}`} className="w-full">
                  <div className="aspect-video bg-gray-200 rounded-lg motion-safe:animate-pulse mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded motion-safe:animate-pulse mb-1"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded motion-safe:animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
