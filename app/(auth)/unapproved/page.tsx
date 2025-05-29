import GoogleLogoutButton from "../components/GoogleLogoutButton";

export default function UnapprovedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
      <h1 className="text-3xl font-bold text-center">
        <span className="md:inline block">シンギュラリティ・ラボ </span>
        <span className="md:inline block">ポータルサイト</span>
      </h1>
      <p className="text-lg text-red-500 font-bold text-center mb-8">
        <span className="md:inline block">※現在、管理者による承認待ちです。</span>
        <span className="md:inline block">承認完了まで今しばらくお待ちください。</span>
      </p>
      <GoogleLogoutButton />
    </div>
  );
}
