"use client";

import { PageTitle } from "@/app/components/PageTitle";
import { useState, useMemo, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEvent } from "@/app/services/api/calendar-server";

interface CalendarPageTemplateProps {
  events: CalendarEvent[];
}

// react-big-calendar用のイベント型
interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEvent;
}

// date-fnsのローカライザーを設定（日本語対応）
const locales = {
  ja: ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// 日本語のメッセージ設定
const messages = {
  allDay: "終日",
  previous: "前",
  next: "次",
  today: "今日",
  month: "月",
  week: "週",
  day: "日",
  agenda: "予定リスト",
  date: "日付",
  time: "時間",
  event: "イベント",
  noEventsInRange: "この期間にイベントはありません",
  showMore: (total: number) => `+ ${total}件`,
};

export function CalendarPageTemplate({ events }: CalendarPageTemplateProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // レスポンシブ対応：画面サイズを検知
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    // 初回マウント時のみ、スマホサイズの場合はagendaビューに切り替え
    const initialCheck = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setView("agenda");
      }
    };

    initialCheck();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // GoogleカレンダーイベントをBigCalendarイベントに変換
  const calendarEvents: BigCalendarEvent[] = useMemo(() => {
    return events.map(event => {
      const startDateTime = event.start?.dateTime || event.start?.date;
      const endDateTime = event.end?.dateTime || event.end?.date;

      // 終日イベントの場合、終了日を1日前に調整（react-big-calendarの仕様）
      let endDate = endDateTime ? new Date(endDateTime) : new Date(startDateTime || new Date());
      if (event.start?.date && !event.start?.dateTime) {
        // 終日イベント
        endDate = new Date(endDate.getTime());
      }

      return {
        id: event.id,
        title: event.summary,
        start: new Date(startDateTime || new Date()),
        end: endDate,
        resource: event,
      };
    });
  }, [events]);

  // イベントがクリックされたときの処理
  const handleSelectEvent = (event: BigCalendarEvent) => {
    setSelectedEvent(event.resource);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setSelectedEvent(null);
  };

  // 日時のフォーマット関数
  const formatDateTime = (event: CalendarEvent) => {
    const startDateTime = event.start?.dateTime || event.start?.date;
    const endDateTime = event.end?.dateTime || event.end?.date;

    if (!startDateTime) return "日時未定";

    const startDate = new Date(startDateTime);
    const endDate = endDateTime ? new Date(endDateTime) : null;

    // 終日イベントかどうかを判定
    const isAllDay = !event.start?.dateTime;

    if (isAllDay) {
      return `${startDate.getMonth() + 1}月${startDate.getDate()}日 (終日)`;
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };

    const startTimeStr = startDate.toLocaleTimeString("ja-JP", timeOptions);
    const endTimeStr = endDate ? endDate.toLocaleTimeString("ja-JP", timeOptions) : "";

    return `${startDate.getMonth() + 1}月${startDate.getDate()}日 ${startTimeStr}${endTimeStr ? ` - ${endTimeStr}` : ""}`;
  };

  // 曜日を取得
  const getDayOfWeek = (event: CalendarEvent) => {
    const startDateTime = event.start?.dateTime || event.start?.date;
    if (!startDateTime) return "";

    const date = new Date(startDateTime);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return days[date.getDay()];
  };

  return (
    <div className="p-3 md:p-6">
      <PageTitle>シンラボカレンダー</PageTitle>

      {/* カレンダー表示 */}
      <div className="bg-white p-3 md:p-6 rounded-lg shadow-md mt-4">
        {/* スマホ用：ビュー切り替えボタン */}
        {isMobile && (
          <div className="mb-4 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setView("agenda")}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                view === "agenda"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              予定リスト
            </button>
            <button
              onClick={() => setView("day")}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                view === "day"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              日
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                view === "week"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              週
            </button>
          </div>
        )}

        <div style={{ height: isMobile ? "500px" : "700px" }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            messages={messages}
            culture="ja"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={() => ({
              style: {
                backgroundColor: "#9333ea",
                borderColor: "#7e22ce",
                color: "white",
              },
            })}
          />
        </div>
      </div>

      {/* イベント詳細モーダル */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg p-4 md:p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 pr-4">{selectedEvent.summary}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs md:text-sm text-gray-500">日時</p>
                <p className="text-sm md:text-base text-gray-900">
                  📅 {formatDateTime(selectedEvent)} ({getDayOfWeek(selectedEvent)})
                </p>
              </div>

              {selectedEvent.location && (
                <div>
                  <p className="text-xs md:text-sm text-gray-500">場所</p>
                  <p className="text-sm md:text-base text-gray-900">📍 {selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <p className="text-xs md:text-sm text-gray-500">説明</p>
                  <p className="text-sm md:text-base text-gray-900 whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {selectedEvent.htmlLink && (
                <a
                  href={selectedEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 text-center text-sm md:text-base bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Googleカレンダーで開く
                </a>
              )}
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm md:text-base bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
