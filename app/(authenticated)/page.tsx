export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-card-foreground mb-6">
          Singularity Lab. ポータルサイトへようこそ！
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            会員向けの資料やプログラミング学習など、<br/>
            シンラボ活動に役立つ情報を提供します。
          </p>
          <div className="flex justify-center gap-4">
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <a href="/documents">資料一覧</a>
            </h3>
            <p className="text-muted-foreground">
              各種申請フォームや資料のリンク集です。
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">動画一覧（追加予定）</h3>
            <p className="text-muted-foreground">
              プログラミング基礎講座の動画を視聴できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
