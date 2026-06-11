export default function MockupDocumentCardPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div data-mockup-capture="document-card-content" className="mx-auto w-80">
        <article className="flex aspect-[4/3] flex-col rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-900">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-slate-600">□</span>
              <span className="truncate">入会手続きガイド</span>
            </div>
            <span className="text-slate-500">⋮</span>
          </div>

          <p className="flex-1 overflow-hidden px-4 py-3 text-sm leading-relaxed text-slate-600">
            シンラボ参加時に必要な申請手続き、各種アカウント登録、利用ルールをまとめた資料です。初回ログイン後に確認してください。
          </p>

          <div className="px-4 pb-4">
            <div className="rounded-md bg-black px-4 py-2 text-center text-sm font-semibold text-white">
              詳細
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
