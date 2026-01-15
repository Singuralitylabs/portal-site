import { PageTitle } from "@/app/components/PageTitle";
import { CalendarEvent } from "@/app/api/calendar/calendar-server";
import { CalendarView } from "./CalendarView";
import { View } from "react-big-calendar";

interface CalendarPageTemplateProps {
  events: CalendarEvent[];
  fetchedStartDate: Date;
  fetchedEndDate: Date;
  defaultView?: View;
}

export function CalendarPageTemplate({
  events,
  fetchedStartDate,
  fetchedEndDate,
  defaultView,
}: CalendarPageTemplateProps) {
  return (
    <>
      <PageTitle>シンラボカレンダー</PageTitle>
      <div className="m-2">
        <CalendarView
          events={events}
          fetchedStartDate={fetchedStartDate}
          fetchedEndDate={fetchedEndDate}
          defaultView={defaultView}
        />
      </div>
    </>
  );
}
