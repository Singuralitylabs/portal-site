import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-3xl font-bold mb-8 text-center">
        <span className="md:inline block">シンギュラリティ・ラボ </span>
        <span className="md:inline block">ポータルサイト</span>
      </h1>
      <GoogleLoginButton />
    </div>
  );
}
