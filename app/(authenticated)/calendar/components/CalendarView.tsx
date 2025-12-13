"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  getDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEvent } from "@/app/api/calendar/calendar-server";
import { EventDetailModal } from "./EventDetailModal";

interface CalendarViewProps {
  events: CalendarEvent[];
  fetchedStartDate: Date;
  fetchedEndDate: Date;
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

// カレンダーIDごとの色定義（固定色）
const CALENDAR_COLORS: { [key: string]: { backgroundColor: string; borderColor: string } } = {
  // シンラボMTGカレンダー
  "c_4df1ec54385c933420637b11092efb7af2d5e7829941f8a7527ec5a8e4a2033d@group.calendar.google.com": {
    backgroundColor: "#9333ea", // 紫色
    borderColor: "#7e22ce",
  },
  // 日本の祝日カレンダー
  "ja.japanese#holiday@group.v.calendar.google.com": {
    backgroundColor: "#ef4444", // 赤色
    borderColor: "#dc2626",
  },
};

// デフォルトの色（カレンダーIDが未設定または未定義の場合）
const DEFAULT_COLOR = {
  backgroundColor: "#6b7280", // グレー
  borderColor: "#4b5563",
};

// カレンダーIDに基づいて色を取得する関数
const getCalendarColor = (
  calendarId?: string
): { backgroundColor: string; borderColor: string } => {
  if (calendarId && CALENDAR_COLORS[calendarId]) {
    return CALENDAR_COLORS[calendarId];
  }
  return DEFAULT_COLOR;
};

export function CalendarView({
  events: initialEvents,
  fetchedStartDate,
  fetchedEndDate,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // 取得済み期間を管理（useRefで最新の値を参照）
  const fetchedRangeRef = useRef({
    start: fetchedStartDate,
    end: fetchedEndDate,
  });

  // 表示期間に基づいて開始日と終了日を計算
  const getDateRange = (currentDate: Date, currentView: View): { start: Date; end: Date } => {
    switch (currentView) {
      case "month":
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
      case "week":
        return {
          start: startOfWeek(currentDate, { locale: ja }),
          end: endOfWeek(currentDate, { locale: ja }),
        };
      case "day":
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        };
      case "agenda":
        // Agendaビューは1ヶ月分表示
        return {
          start: currentDate,
          end: new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            currentDate.getDate()
          ),
        };
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
    }
  };

  // カレンダーイベントを取得（範囲外の場合のみ）
  const fetchEvents = useCallback(async (currentDate: Date, currentView: View) => {
    const { start, end } = getDateRange(currentDate, currentView);

    // 既に取得済み範囲内の場合はスキップ
    const fetchedRange = fetchedRangeRef.current;
    if (start >= fetchedRange.start && end <= fetchedRange.end) {
      return;
    }

    setIsLoading(true);
    try {
      // 取得範囲を拡張（表示期間の前後1ヶ月）
      const expandedStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      const expandedEnd = new Date(end.getFullYear(), end.getMonth() + 2, 0);

      const response = await fetch(
        `/api/calendar/events?start=${expandedStart.toISOString()}&end=${expandedEnd.toISOString()}`
      );
      const data = await response.json();

      if (data.success) {
        // 既存イベントと新規イベントをマージ（重複排除）
        setEvents(prevEvents => {
          const mergedEvents = [...prevEvents, ...data.events];
          const uniqueEvents = Array.from(
            new Map(mergedEvents.map(event => [event.id, event])).values()
          );
          return uniqueEvents;
        });

        // 取得済み範囲を更新
        fetchedRangeRef.current = {
          start: new Date(
            Math.min(fetchedRangeRef.current.start.getTime(), expandedStart.getTime())
          ),
          end: new Date(Math.max(fetchedRangeRef.current.end.getTime(), expandedEnd.getTime())),
        };
      }
    } catch (error) {
      console.error("イベント取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 日付またはビューが変更されたときに必要に応じてイベントを取得
  useEffect(() => {
    fetchEvents(date, view);
  }, [date, view, fetchEvents]);

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
        {/* ローディング表示 */}
        {isLoading && (
          <div className="mb-3 text-center text-sm text-gray-600">
            <span className="inline-block animate-spin mr-2">⏳</span>
            イベントを読み込み中...
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
            eventPropGetter={event => {
              const calendarId = (event.resource as CalendarEvent).calendarId;
              const colors = getCalendarColor(calendarId);
              return {
                style: {
                  backgroundColor: colors.backgroundColor,
                  borderColor: colors.borderColor,
                  color: "white",
                },
              };
            }}
          />
        </div>
      </div>
      <EventDetailModal event={selectedEvent} onClose={handleCloseModal} />
    </>
  );
}
