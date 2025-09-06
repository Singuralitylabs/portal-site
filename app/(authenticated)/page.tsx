import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-card-foreground mb-6">
            Singularity Lab. ポータルサイトへようこそ！
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-full sm:max-w-2xl mx-auto">
            会員向けの資料やプログラミング学習など、 シンラボ活動に役立つ情報を提供します。
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <Link href="/documents">資料一覧</Link>
            </h3>
            <p className="text-muted-foreground">各種申請フォームや資料のリンク集です。</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <Link href="/videos">動画一覧</Link>
            </h3>
            <p className="text-muted-foreground">
              シンラボ活動やスキルアップなど、
              <br />
              シンラボで提供された様々な動画を視聴できます。
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <Link href="/members">会員リスト</Link>
            </h3>
            <p className="text-muted-foreground">
              シンラボメンバーの紹介ページです。
              <br />
              メンバー同士の交流にご活用ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
