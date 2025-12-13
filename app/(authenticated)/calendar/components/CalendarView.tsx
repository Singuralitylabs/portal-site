"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEvent } from "@/app/services/api/calendar-server";
import { EventDetailModal } from "./EventDetailModal";

interface CalendarViewProps {
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

export function CalendarView({ events }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

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

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  return (
    <>
      <div className="bg-white p-3 md:p-6 rounded-lg shadow-md mt-4">
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
      <EventDetailModal event={selectedEvent} onClose={handleCloseModal} />
    </>
  );
}
