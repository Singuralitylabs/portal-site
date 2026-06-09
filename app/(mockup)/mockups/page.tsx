import Link from "next/link";

export default function MockupsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">画面モック検証ページ</h1>
        <p className="mt-2 text-sm text-slate-600">
          このページは機能設計書向けの HTML モック検証用です。実データ取得や認証処理は行いません。
        </p>

        <ul className="mt-6 space-y-3">
          <li>
            <Link
              href="/mockups/login"
              className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              ログイン画面モック
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
