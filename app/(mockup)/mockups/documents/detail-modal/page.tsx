export default function MockupDocumentDetailModalPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div
        data-mockup-capture="document-detail-modal-content"
        className="mx-auto w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">資料詳細</h1>
          <span className="text-xl text-slate-500">×</span>
        </div>

        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-900">入会手続きガイド</h2>

          <section>
            <p className="mb-2 text-sm text-slate-500">詳細説明</p>
            <p className="text-sm leading-relaxed text-slate-700">
              シンラボ参加時に必要な申請手続き、各種アカウント登録、利用ルールをまとめた資料です。
              初回ログイン後に確認し、必要な設定を順番に進めてください。改行を含む長い説明文もこの領域に全文表示されます。
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">カテゴリー:</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
              事務局資料
            </span>
          </div>

          <div className="text-sm text-slate-500">責任者: 事務局</div>

          <div className="rounded-md bg-black px-4 py-2 text-center text-sm font-semibold text-white">
            資料を開く
          </div>
        </div>
      </div>
    </main>
  );
}
