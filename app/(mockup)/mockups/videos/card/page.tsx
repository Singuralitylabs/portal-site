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

export default function MockupVideoCardPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div data-mockup-capture="video-card-content" className="mx-auto w-80">
        <article className="relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <span className="absolute right-3 top-2 z-10 text-slate-500">⋮</span>
          <VideoThumbnail />
          <div className="p-4">
            <h3 className="mb-2 truncate text-lg font-bold text-slate-900">TypeScript入門</h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
              TypeScriptの基本構文、型定義、React/Next.jsでの活用方法を学べる動画です。
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
