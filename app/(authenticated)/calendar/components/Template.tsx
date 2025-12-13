import { PageTitle } from "@/app/components/PageTitle";
import { CalendarEvent } from "@/app/api/calendar/calendar-server";
import { CalendarView } from "./CalendarView";

interface CalendarPageTemplateProps {
  events: CalendarEvent[];
  fetchedStartDate: Date;
  fetchedEndDate: Date;
}

export function CalendarPageTemplate({
  events,
  fetchedStartDate,
  fetchedEndDate,
}: CalendarPageTemplateProps) {
  return (
    <>
      <PageTitle>シンラボカレンダー</PageTitle>
      <div className="m-2">
        <CalendarView
          events={events}
          fetchedStartDate={fetchedStartDate}
          fetchedEndDate={fetchedEndDate}
        />
      </div>
    </>
  );
}
