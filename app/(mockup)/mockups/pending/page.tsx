export default function MockupPendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div
        data-mockup-capture="pending-content"
        className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">シンラボポータルサイト</h1>

        <div className="mb-8">
          <p className="text-gray-600 mb-4">※現在、管理者による承認待ちです。</p>
          <p className="text-gray-600">承認完了まで今しばらくお待ちください。</p>
        </div>

        <button
          type="button"
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md"
          aria-disabled="true"
        >
          ログアウト
        </button>
      </div>
    </main>
  );
}
