const categories = [
  {
    name: "プログラミング学習",
    videos: [
      "TypeScript入門",
      "Next.js実践",
      "Supabase連携",
      "AI開発基礎",
      "UI実装演習",
      "レビュー会",
    ],
  },
  {
    name: "交流会",
    videos: ["月例交流会", "LT大会アーカイブ", "もくもく会ダイジェスト"],
  },
];

function VideoThumbnail() {
  return (
    <div className="relative aspect-video overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f766e,#1d4ed8)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl text-slate-900 shadow">
          ▶
        </div>
      </div>
      <div className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-0.5 text-xs text-white">
        18:32
      </div>
    </div>
  );
}

function VideoCardPreview({ name }: { name: string }) {
  return (
    <article className="relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <span className="absolute right-3 top-2 z-10 text-slate-500">⋮</span>
      <VideoThumbnail />
      <div className="p-4">
        <h3 className="mb-2 truncate text-lg font-bold text-slate-900">{name}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
          シンラボ活動やスキルアップに関する動画です。概要文を2行程度で表示します。
        </p>
      </div>
    </article>
  );
}

export default function MockupVideosPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div data-mockup-capture="videos-layout-content" className="mx-auto w-full max-w-6xl">
        <div className="sticky top-0 z-10 bg-white pb-2">
          <h1 className="text-3xl font-bold text-slate-900">動画一覧</h1>
          <div className="mt-4 flex flex-wrap gap-3 py-4">
            {categories.map(category => (
              <span key={category.name} className="text-sm font-medium text-blue-600">
                {category.name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {categories.map(category => (
            <section key={category.name}>
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">{category.name}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {category.videos.map(video => (
                  <VideoCardPreview key={video} name={video} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 text-left">
          <span className="text-blue-600">TOPへ</span>
        </div>
      </div>
    </main>
  );
}
