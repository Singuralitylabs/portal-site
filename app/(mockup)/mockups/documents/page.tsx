const categories = [
  {
    name: "事務局資料",
    documents: ["入会手続きガイド", "活動ルール", "運営資料", "定例会議メモ", "広報申請書", "FAQ"],
  },
  {
    name: "広報用資料",
    documents: ["ロゴ素材", "イベント告知文", "SNS投稿テンプレート"],
  },
];

function DocumentCardPreview({ name }: { name: string }) {
  return (
    <article className="flex aspect-[4/3] flex-col rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-900">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-slate-600">□</span>
          <span className="truncate">{name}</span>
        </div>
      </div>
      <p className="flex-1 overflow-hidden px-4 py-3 text-sm leading-relaxed text-slate-600">
        シンラボ内で利用する資料の概要を4行程度で表示します。詳細ボタンから全文と関連情報を確認できます。
      </p>
      <div className="px-4 pb-4">
        <div className="rounded-md bg-black px-4 py-2 text-center text-sm font-semibold text-white">
          詳細
        </div>
      </div>
    </article>
  );
}

export default function MockupDocumentsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div data-mockup-capture="documents-layout-content" className="mx-auto w-full max-w-6xl">
        <div className="sticky top-0 z-10 bg-white pb-2">
          <h1 className="text-3xl font-bold text-slate-900">資料一覧</h1>
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
                {category.documents.map(document => (
                  <DocumentCardPreview key={document} name={document} />
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
