import { CalendarPageTemplate } from "./components/Template";
import { fetchCalendarEvents } from "@/app/services/api/calendar-server";

export default async function CalendarPage() {
  const { data: events, error } = await fetchCalendarEvents();

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
