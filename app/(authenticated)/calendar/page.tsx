import { CalendarPageTemplate } from "./components/Template";
import { fetchCalendarEvents } from "@/app/services/api/calendar-server";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function CalendarPage() {
  // 初期表示は現在月のイベントを取得
  const now = new Date();
  const { data: events, error } = await fetchCalendarEvents({
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
  });

  if (error || !events) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">シンラボカレンダー</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700">❌ {error || "カレンダーイベントの取得に失敗しました"}</p>
          <p className="text-sm text-red-600 mt-2">
            サービスアカウントの権限設定を確認してください。
          </p>
        </div>
      </div>
    );
  }

  return <CalendarPageTemplate events={events} />;
}
