"use client";

import { CalendarEvent } from "@/app/api/calendar/calendar-server";
import DOMPurify from "isomorphic-dompurify";
import Linkify from "linkify-react";

interface EventDetailModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  if (!event) return null;

  // 日時のフォーマット関数
  const formatDateTime = (event: CalendarEvent) => {
    const startDateTime = event.start?.dateTime || event.start?.date;
    const endDateTime = event.end?.dateTime || event.end?.date;

    if (!startDateTime) return "日時未定";

    const startDate = new Date(startDateTime);
    const endDate = endDateTime ? new Date(endDateTime) : null;

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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 md:p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 pr-4">{event.summary}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs md:text-sm text-gray-500">日時</p>
            <p className="text-sm md:text-base text-gray-900">
              {formatDateTime(event)} ({getDayOfWeek(event)})
            </p>
          </div>

          {event.location && (
            <div>
              <p className="text-xs md:text-sm text-gray-500">場所</p>
              <p className="text-sm md:text-base text-gray-900">
                📍
                <Linkify
                  options={{
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-blue-600 hover:underline",
                  }}
                >
                  {event.location}
                </Linkify>
              </p>
            </div>
          )}

          {event.description && (
            <div>
              <p className="text-xs md:text-sm text-gray-500">説明</p>
              <div className="text-sm md:text-base text-gray-900 prose prose-sm max-w-none">
                <Linkify
                  options={{
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-blue-600 hover:underline",
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(event.description, {
                        ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br", "p", "ul", "ol", "li"],
                        ALLOWED_ATTR: ["href", "target", "rel"],
                      }),
                    }}
                  />
                </Linkify>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 text-center text-sm md:text-base bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Googleカレンダーで開く
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
