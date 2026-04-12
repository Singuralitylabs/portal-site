import type { CalendarEvent } from "@/app/api/calendar/calendar-server";

type TodayEventsWidgetProps = {
  events: CalendarEvent[];
  error: string | null;
  todayLabel: string;
  todayStart: string; // ISO 8601
  todayEnd: string; // ISO 8601
};

function toHHmm(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatEventTime(event: CalendarEvent, todayStart: Date, todayEnd: Date): string {
  if (!event.start?.dateTime) return "終日";

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end?.dateTime ?? event.start.dateTime);

  const startIsToday = start >= todayStart && start < todayEnd;
  const endIsToday = end > todayStart && end < todayEnd;

  if (startIsToday && endIsToday) {
    return `${toHHmm(start)}〜${toHHmm(end)}`;
  } else if (startIsToday && !endIsToday) {
    return `${toHHmm(start)}〜`;
  } else if (!startIsToday && endIsToday) {
    return `〜${toHHmm(end)}`;
  } else {
    return "終日";
  }
}

export default function TodayEventsWidget({
  events,
  error,
  todayLabel,
  todayStart,
  todayEnd,
}: TodayEventsWidgetProps) {
  const start = new Date(todayStart);
  const end = new Date(todayEnd);

  return (
    <div className="bg-card rounded-lg shadow p-4">
      <span className="text-2xl font-semibold text-green-600 block mb-3">
        {todayLabel}のイベント
      </span>

      {error !== null ? (
        <p className="text-sm text-muted-foreground">カレンダーイベントの取得に失敗しました。</p>
      ) : events.length === 0 ? (
        <p className="text-base text-muted-foreground">本日のイベントはありません</p>
      ) : (
        <ul className="space-y-2">
          {events.map(event => (
            <li key={event.id} className="flex gap-3 text-base">
              <span className="text-muted-foreground whitespace-nowrap w-28 shrink-0">
                {formatEventTime(event, start, end)}
              </span>
              <div className="min-w-0">
                {event.htmlLink ? (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-words"
                  >
                    {event.summary || "(タイトルなし)"}
                  </a>
                ) : (
                  <span className="break-words">{event.summary || "(タイトルなし)"}</span>
                )}
                {event.location && (
                  <p className="text-muted-foreground text-xs mt-0.5">
                    場所:{" "}
                    {event.location.startsWith("http://") ||
                    event.location.startsWith("https://") ? (
                      <a
                        href={event.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {event.location}
                      </a>
                    ) : (
                      event.location
                    )}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
