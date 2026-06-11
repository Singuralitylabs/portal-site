export function LoginMockTemplate() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div data-mockup-capture="login-content" className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <span className="md:inline block">シンギュラリティ・ラボ </span>
            <span className="md:inline block">ポータルサイト</span>
          </h1>
          <p className="text-lg text-red-500 font-bold mt-4">
            <span className="md:inline block">本サイトには、シンギュラリティ・ラボの</span>
            <span className="md:inline block">会員のみアクセスできます。</span>
          </p>
        </div>

        <div className="flex justify-center pb-4">
          <button
            type="button"
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm text-lg font-medium"
            aria-disabled="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Googleでログイン
          </button>
        </div>

        <div className="flex justify-center">
          <div className="max-w-md bg-blue-50 border border-blue-200 rounded-lg px-4 text-sm text-gray-700">
            <p className="font-semibold text-lg text-blue-900 mb-2">ログイン時のご連絡</p>
            <p className="leading-relaxed text-base">
              Googleアカウント選択画面では、Supabaseの認証システムを利用している仕様上、下記のURLが表示されます。
              <br />
              本URLはシンラボのポータルサイトへのアクセスページなので、安心してログインしてください。
            </p>
            <p className="text-center text-base">anawnwhhsgragkcorecl.supabase.co</p>
          </div>
        </div>
      </div>
    </main>
  );
}
