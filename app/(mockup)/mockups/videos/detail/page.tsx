export default function MockupVideoDetailPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div data-mockup-capture="video-detail-content" className="mx-auto w-full max-w-3xl">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">TypeScript入門</h1>

        <section className="overflow-hidden rounded-b-md bg-white shadow-md">
          <div className="relative aspect-video overflow-hidden bg-slate-900">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f766e,#1d4ed8)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl text-slate-900 shadow">
                ▶
              </div>
            </div>
            <div className="absolute bottom-3 right-3 rounded bg-black/75 px-2 py-1 text-sm text-white">
              18:32
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-900">
                プログラミング学習
              </span>
              <span className="text-sm text-slate-700">責任者：学習チーム</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-700">
              <span>□ 2026-02-22</span>
              <span>ビデオの長さ 18:32</span>
            </div>
          </div>
        </section>

        <section className="mt-4 border-t border-slate-300 pt-4">
          <p className="text-sm leading-relaxed text-slate-700">
            TypeScriptの基本構文、型定義、React/Next.jsでの活用方法を学べる動画です。
            実装例を見ながら、日々の開発で安全に型を扱うためのポイントを確認できます。
          </p>
        </section>
      </div>
    </main>
  );
}
