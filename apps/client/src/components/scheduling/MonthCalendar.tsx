import type { ScheduleDay } from "@homelabconnect/shared";
import { format, getISODay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { datesOfMonth, describeDay } from "../../format/schedule";
import { formatTime } from "../../format/settings";

interface MonthCalendarProps {
  /** First day of the month, "YYYY-MM-01". */
  month: string;
  /** The month's days; missing dates show as loading. */
  days: readonly ScheduleDay[] | null;
  /** Dates picked for editing; leave out for a read-only calendar. */
  selected?: ReadonlySet<string>;
  onToggle?(date: string): void;
}

const weekdayHeadings = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusStyles = {
  working: "border-emerald-200 bg-emerald-50 text-emerald-900",
  off: "border-slate-200 bg-white text-muted-foreground",
  closed: "border-amber-200 bg-amber-50 text-amber-900",
  leave: "border-sky-200 bg-sky-50 text-sky-900",
};

/** What a cell says under the day number. */
function cellText(day: ScheduleDay | undefined) {
  if (!day) return null;
  switch (day.status) {
    case "working":
      return (
        <>
          <span className="block">{formatTime(day.start ?? "")}</span>
          <span className="block">{formatTime(day.end ?? "")}</span>
        </>
      );
    case "leave":
      return <span className="block font-medium">On leave</span>;
    case "closed":
      return <span className="block truncate">{day.label ?? "Closed"}</span>;
    default:
      return <span className="block">Off</span>;
  }
}

/**
 * A month as a Monday-first grid. Each day shows its hours, Off, the closed
 * day's name, or On leave. With `onToggle`, days are buttons that pick them.
 */
export function MonthCalendar({ month, days, selected, onToggle }: MonthCalendarProps) {
  const dates = datesOfMonth(month);
  const byDate = new Map((days ?? []).map((day) => [day.date, day]));
  const leadingBlanks = getISODay(parseISO(month)) - 1;
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {weekdayHeadings.map((heading) => (
          <div key={heading} className="py-1">
            {heading}
          </div>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-1"
        role="grid"
        aria-label={format(parseISO(month), "MMMM yyyy")}
      >
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden />
        ))}
        {dates.map((date) => {
          const day = byDate.get(date);
          const isSelected = selected?.has(date) ?? false;
          const label = `${format(parseISO(date), "EEEE, MMMM d")}: ${day ? describeDay(day) : "loading"}`;
          const className = cn(
            "flex min-h-16 flex-col items-start rounded-md border p-1.5 text-left text-[11px] leading-tight",
            day ? statusStyles[day.status] : "border-slate-100 bg-slate-50",
            date === today && "ring-1 ring-brand-500",
            isSelected && "border-brand-600 bg-brand-100 text-brand-900 ring-2 ring-brand-600",
          );
          const content = (
            <>
              <span className="mb-0.5 text-xs font-semibold">{Number(date.slice(8))}</span>
              {cellText(day)}
            </>
          );
          return onToggle ? (
            <button
              key={date}
              type="button"
              className={cn(className, "hover:border-brand-400")}
              aria-pressed={isSelected}
              aria-label={label}
              onClick={() => onToggle(date)}
            >
              {content}
            </button>
          ) : (
            <div key={date} className={className} role="gridcell" aria-label={label}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The colour key under a calendar. */
export function CalendarLegend() {
  const items = [
    ["Working", statusStyles.working],
    ["Off", statusStyles.off],
    ["On leave", statusStyles.leave],
    ["Closed", statusStyles.closed],
  ] as const;
  return (
    <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map(([label, style]) => (
        <li key={label} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-sm border", style)} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
