import Link from "next/link";
import { fetchCalendarEvents } from "@/app/api/calendar/calendar-server";
import TodayEventsWidget from "@/app/(authenticated)/components/TodayEventsWidget";

export default async function Home() {
  // Asia/Tokyo 基準で当日の開始・終了を算出
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;

  const timeMin = new Date(`${y}-${m}-${d}T00:00:00+09:00`);
  const timeMax = new Date(`${y}-${m}-${d}T00:00:00+09:00`);
  timeMax.setDate(timeMax.getDate() + 1);

  const todayLabel = `${y}/${Number(m)}/${Number(d)}`;

  const { data: events, error } = await fetchCalendarEvents({ startDate: timeMin, endDate: timeMax });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-card-foreground mb-6">
            Singularity Lab. ポータルサイトへようこそ！
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-full sm:max-w-2xl mx-auto">
            シンラボ活動に役立つ情報を提供します。
          </p>
        </div>

        <div className="mb-8">
          <TodayEventsWidget
            events={events ?? []}
            error={error}
            todayLabel={todayLabel}
            todayStart={timeMin.toISOString()}
            todayEnd={timeMax.toISOString()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <Link href="/documents">資料</Link>
            </h3>
            <p className="text-muted-foreground">各種申請フォームや資料のリンク集です。</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <Link href="/videos">動画</Link>
            </h3>
            <p className="text-muted-foreground">
              シンラボ活動やスキルアップなど、
              <br />
              シンラボで提供された様々な動画を視聴できます。
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <Link href="/applications">アプリ</Link>
            </h3>
            <p className="text-muted-foreground">
              シンラボメンバーが開発したアプリケーションを紹介しています。
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <Link href="/members">会員</Link>
            </h3>
            <p className="text-muted-foreground">
              シンラボ会員の紹介ページです。
              <br />
              メンバー同士の交流にご活用ください。
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              <Link href="/calendar">カレンダー</Link>
            </h3>
            <p className="text-muted-foreground">シンラボ関連イベントや予定を確認できます。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
