import { PageTitle } from "@/app/components/PageTitle";
import { CalendarEvent } from "@/app/api/calendar/calendar-server";
import { CalendarView } from "./CalendarView";

interface CalendarPageTemplateProps {
  events: CalendarEvent[];
}

export function CalendarPageTemplate({ events }: CalendarPageTemplateProps) {
  return (
    <>
      <PageTitle>シンラボカレンダー</PageTitle>
      <div className="m-2">
        <CalendarView events={events} />
      </div>
    </>
  );
}
