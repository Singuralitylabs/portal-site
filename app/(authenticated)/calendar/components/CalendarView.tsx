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
import {
  CALENDAR_COLORS,
  CALENDAR_MESSAGES,
  DEFAULT_CALENDAR_COLOR,
  EVENT_TEXT_COLOR,
} from "@/app/constants/calendar";

interface CalendarViewProps {
  events: CalendarEvent[];
  fetchedStartDate: Date;
  fetchedEndDate: Date;
  defaultView?: View;
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

export function CalendarView({
  events: initialEvents,
  fetchedStartDate,
  fetchedEndDate,
  defaultView = "month",
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>(defaultView);
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

  // カレンダーIDに基づいて色を取得する関数
  const getCalendarColor = (
    calendarId?: string
  ): { backgroundColor: string; borderColor: string } => {
    if (calendarId && CALENDAR_COLORS[calendarId]) {
      return CALENDAR_COLORS[calendarId];
    }
    return DEFAULT_CALENDAR_COLOR;
  };

  // GoogleカレンダーイベントをBigCalendarイベントに変換
  const calendarEvents: BigCalendarEvent[] = useMemo(() => {
    return events.map(event => {
      const startDateTime = event.start?.dateTime || event.start?.date;
      const endDateTime = event.end?.dateTime || event.end?.date;

      const isAllDayEvent = event.start?.date && !event.start?.dateTime;

      let startDate = new Date(startDateTime || new Date());
      let endDate: Date;

      if (isAllDayEvent) {
        // 終日イベントの場合、開始日を00:00:00に、終了日を23:59:59.999に設定
        // これにより、当日のみ表示される（react-big-calendarの終了日は排他的）
        startDate = new Date(startDate);
        startDate.setHours(0, 0, 0, 0);

        // 終了日を開始日の23:59:59.999に設定
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // 時刻指定イベントの場合、そのまま使用
        startDate = new Date(startDateTime || new Date());
        endDate = endDateTime ? new Date(endDateTime) : new Date(startDate);
      }

      return {
        id: event.id,
        title: event.summary,
        start: startDate,
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
        {isLoading && (
          <div className="mb-3 text-center text-sm text-gray-600">
            <span className="inline-block animate-spin mr-2">⏳</span>
            イベントを読み込み中...
          </div>
        )}

        <div className="h-[500px] md:h-[700px]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            messages={CALENDAR_MESSAGES}
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
                  color: EVENT_TEXT_COLOR,
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
