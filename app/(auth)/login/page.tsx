import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full space-y-6">
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
          <GoogleLoginButton />
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
    </div>
  );
}
