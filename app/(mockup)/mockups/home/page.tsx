const events = [
  {
    time: "08:00〜09:00",
    title: "GPT'sチームミーティング",
    location: "Discord",
  },
  {
    time: "09:00〜10:00",
    title: "ハロスク会議",
  },
  {
    time: "10:15〜12:00",
    title: "もくもく会",
    location: "オンライン",
  },
];

const cards = [
  {
    title: "資料",
    description: "各種申請フォームや資料のリンク集です。",
  },
  {
    title: "動画",
    description: "シンラボ活動やスキルアップなど、シンラボで提供された様々な動画を視聴できます。",
  },
  {
    title: "アプリ",
    description: "シンラボメンバーが開発したアプリケーションを紹介しています。",
  },
  {
    title: "会員",
    description: "シンラボ会員の紹介ページです。メンバー同士の交流にご活用ください。",
  },
  {
    title: "カレンダー",
    description: "シンラボ関連イベントや予定を確認できます。",
  },
  {
    title: "クイックリンク",
    description: "シンラボ関連サービスや公式リンクへ素早くアクセスできます。",
  },
];

export default function MockupHomePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div data-mockup-capture="home-content" className="mx-auto w-full max-w-5xl space-y-8">
        <section className="text-center px-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-card-foreground mb-6">
            Singularity Lab. ポータルサイトへようこそ！
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            シンラボ活動に役立つ情報を提供します。
          </p>
        </section>

        <section className="bg-card rounded-lg shadow p-4">
          <span className="text-2xl font-semibold text-green-600 block mb-3">
            2026/2/22のイベント
          </span>

          <ul className="space-y-2">
            {events.map(event => (
              <li key={`${event.time}-${event.title}`} className="flex gap-3 text-base">
                <span className="text-muted-foreground whitespace-nowrap w-28 shrink-0">
                  {event.time}
                </span>
                <div className="min-w-0">
                  <span className="text-primary break-words">{event.title}</span>
                  {event.location && (
                    <p className="text-muted-foreground text-xs mt-0.5">場所: {event.location}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map(card => (
            <article key={card.title} className="bg-card p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{card.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
