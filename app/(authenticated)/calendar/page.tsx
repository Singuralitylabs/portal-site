import { CalendarPageTemplate } from "./components/Template";
import { fetchCalendarEvents } from "@/app/api/calendar/calendar-server";
import { headers } from "next/headers";
import { View } from "react-big-calendar";

export default async function CalendarPage() {
  // User-Agentからモバイル判定を行い、初期ビューを決定
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = /mobile/i.test(userAgent);
  const defaultView: View = isMobile ? "agenda" : "month";

  // 初期表示は前後3ヶ月分（合計6ヶ月分）のイベントを取得
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 4, 0); // +3ヶ月の末日

  const { data: events, error } = await fetchCalendarEvents({
    startDate,
    endDate,
  });

  if (error || !events) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">シンラボカレンダー</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700 text-xl">カレンダーイベントの取得に失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <CalendarPageTemplate
      events={events}
      fetchedStartDate={startDate}
      fetchedEndDate={endDate}
      defaultView={defaultView}
    />
  );
}
