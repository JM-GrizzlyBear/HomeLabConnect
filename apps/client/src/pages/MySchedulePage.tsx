import { format, parseISO } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { CalendarLegend, MonthCalendar } from "@/components/scheduling/MonthCalendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fetchMySchedule } from "../api/scheduling";
import { useApiData } from "../api/useApiData";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { monthEnd, monthOf, shiftMonth } from "../format/schedule";

/** A staff member's month: working hours, days off, holidays and leave. */
export function MySchedulePage() {
  const [month, setMonth] = useState(() => monthOf());
  const { data: days, error } = useApiData(
    (token, signal) => fetchMySchedule(token, month, monthEnd(month), signal),
    [month],
    { errorMessage: "Could not load your schedule. Try again." },
  );
  const working = days?.filter((day) => day.status === "working").length ?? 0;
  const onLeave = days?.filter((day) => day.status === "leave").length ?? 0;

  return (
    <>
      <PageHeader title="My Schedule" />
      <ContentCard
        title={format(parseISO(month), "MMMM yyyy")}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => setMonth((current) => shiftMonth(current, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => setMonth((current) => shiftMonth(current, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        }
      >
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {days && (
              <p className="mb-3 text-sm text-muted-foreground">
                {working} working {working === 1 ? "day" : "days"}
                {onLeave > 0 && ` · ${onLeave} ${onLeave === 1 ? "day" : "days"} on leave`}
              </p>
            )}
            <MonthCalendar month={month} days={days} />
            <CalendarLegend />
          </>
        )}
      </ContentCard>
    </>
  );
}
