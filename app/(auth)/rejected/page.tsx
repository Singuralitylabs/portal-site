export default function RejectedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">シンラボポータルサイト</h1>

        <div className="mb-8">
          <p className="text-red-600 mb-4 font-semibold">※承認されませんでした。</p>
          <p className="text-gray-600 mb-4">管理者にお問い合わせください。</p>
          <p className="text-blue-600 underline">admin@singularitylab.jp</p>
        </div>
      </div>
    </div>
  );
}
