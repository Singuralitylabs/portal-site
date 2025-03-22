import GoogleLoginButton from "@/app/(auth)/components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <h1 className="text-3xl font-bold text-center">
        <span className="md:inline block">シンギュラリティ・ラボ </span>
        <span className="md:inline block">ポータルサイト</span>
      </h1>
      <p className="text-lg text-red-500 font-bold text-center mb-8">
        <span className="md:inline block">本サイトには、シンギュラリティ・ラボの</span>
        <span className="md:inline block">会員のみアクセスできます。</span>
      </p>
      <GoogleLoginButton />
    </div>
  );
}
