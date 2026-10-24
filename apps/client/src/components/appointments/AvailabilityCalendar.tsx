import type { DayAvailability } from "@homelabconnect/shared";
import { format, getISODay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { closedReasonLabels } from "../../format/appointments";
import { datesOfMonth } from "../../format/schedule";
import { formatTime } from "../../format/settings";

interface AvailabilityCalendarProps {
  /** First day of the month, "YYYY-MM-01". */
  month: string;
  days: readonly DayAvailability[] | null;
  selected: string | null;
  onSelect(date: string): void;
}

const weekdayHeadings = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const placesLeft = (day: DayAvailability) => day.slots.reduce((sum, slot) => sum + slot.left, 0);

/** A month of bookable days: open days are buttons; closed ones say why. */
export function AvailabilityCalendar({
  month,
  days,
  selected,
  onSelect,
}: AvailabilityCalendarProps) {
  const byDate = new Map((days ?? []).map((day) => [day.date, day]));
  const leadingBlanks = getISODay(parseISO(month)) - 1;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {weekdayHeadings.map((heading) => (
          <div key={heading} className="py-1">
            {heading}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" aria-label={format(parseISO(month), "MMMM yyyy")}>
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden />
        ))}
        {datesOfMonth(month).map((date) => {
          const day = byDate.get(date);
          const open = day !== undefined && day.closedReason === null;
          const note = !day
            ? null
            : open
              ? `${placesLeft(day)} open`
              : day.closedReason === "closed_day"
                ? (day.label ?? "Closed")
                : closedReasonLabels[day.closedReason ?? "full"];
          const isSelected = selected === date;
          return (
            <button
              key={date}
              type="button"
              disabled={!open}
              aria-pressed={isSelected}
              aria-label={`${format(parseISO(date), "EEEE, MMMM d")}: ${note ?? "loading"}`}
              onClick={() => onSelect(date)}
              className={cn(
                "flex min-h-16 flex-col items-start rounded-md border p-1.5 text-left text-[11px] leading-tight",
                !day && "border-slate-100 bg-slate-50",
                day &&
                  !open &&
                  "cursor-not-allowed border-slate-100 bg-slate-50 text-muted-foreground",
                open && "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-brand-400",
                isSelected && "border-brand-600 bg-brand-100 text-brand-900 ring-2 ring-brand-600",
              )}
            >
              <span className="mb-0.5 text-xs font-semibold">{Number(date.slice(8))}</span>
              {note && <span className="block truncate">{note}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SlotPickerProps {
  day: DayAvailability;
  selected: string | null;
  onSelect(slot: string): void;
}

/** The day's time slots as chips; full ones are disabled. */
export function SlotPicker({ day, selected, onSelect }: SlotPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Visit time">
      {day.slots.map((slot) => (
        <button
          key={slot.start}
          type="button"
          disabled={slot.left === 0}
          aria-pressed={selected === slot.start}
          onClick={() => onSelect(slot.start)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition",
            slot.left === 0
              ? "cursor-not-allowed border-slate-100 bg-slate-50 text-muted-foreground line-through"
              : "border-slate-200 bg-white hover:border-brand-400",
            selected === slot.start &&
              "border-brand-600 bg-brand-600 text-white hover:border-brand-600",
          )}
        >
          {formatTime(slot.start)}
          <span className="ml-1.5 text-xs opacity-75">
            {slot.left === 0 ? "full" : `${slot.left} left`}
          </span>
        </button>
      ))}
    </div>
  );
}
