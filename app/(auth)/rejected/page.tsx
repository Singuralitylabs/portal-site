import GoogleLogoutButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <h1 className="text-3xl font-bold text-center">
        <span className="md:inline block">シンギュラリティ・ラボ </span>
        <span className="md:inline block">ポータルサイト</span>
      </h1>
      <p className="text-lg text-red-500 font-bold text-center mb-8">
        <span className="md:inline block">※承認されませんでした。</span>
        <span className="md:inline block">管理者にお問い合わせください。</span>
      </p>
      <p> (管理者のメールアドレス) </p>
    </div>
  );
}
