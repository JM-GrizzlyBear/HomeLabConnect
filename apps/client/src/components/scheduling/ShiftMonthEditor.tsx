import type { StaffMember } from "@homelabconnect/shared";
import { format, getISODay, parseISO } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { SelectInputField } from "@/components/form/SelectInputField";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError } from "../../api/apiClient";
import { fetchShiftBoard, saveShiftDays } from "../../api/scheduling";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { useFeedback } from "../../feedback/feedbackContext";
import { datesOfMonth, monthEnd, monthOf, shiftMonth } from "../../format/schedule";
import { formatTime, timeOptions } from "../../format/settings";
import { CalendarLegend, MonthCalendar } from "./MonthCalendar";

export interface ShiftEditorTarget {
  person: StaffMember;
  /** A day in the month to open; it also starts picked when `pick` is true. */
  date: string;
  pick?: boolean;
}

interface ShiftMonthEditorProps {
  target: ShiftEditorTarget | null;
  onClose(): void;
  /** Called after a change, so the board can reload. */
  onSaved(): void;
}

/** ISO weekdays (1 = Monday … 7 = Sunday) for each quick pick. */
const quickPicks = [
  { label: "Mon–Fri", weekdays: [1, 2, 3, 4, 5] },
  { label: "Mon–Sat", weekdays: [1, 2, 3, 4, 5, 6] },
  { label: "Every day", weekdays: [1, 2, 3, 4, 5, 6, 7] },
];

const minutes = (time: string) => {
  const [hours = 0, mins = 0] = time.split(":").map(Number);
  return hours * 60 + mins;
};

/**
 * Sets someone's shifts a month at a time: choose the hours once, pick the
 * days on the calendar (or a quick pick), then give them those hours or make
 * them days off. Leave and holidays show on the calendar as they are.
 */
export function ShiftMonthEditor({ target, onClose, onSaved }: ShiftMonthEditorProps) {
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {target && (
          <EditorBody
            key={`${target.person.id}-${target.date}`}
            target={target}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditorBody({ target, onSaved }: { target: ShiftEditorTarget; onSaved(): void }) {
  const feedback = useFeedback();
  const { person } = target;
  const [month, setMonth] = useState(() => monthOf(target.date));
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(target.pick ? [target.date] : []),
  );
  const [hours, setHours] = useState({ start: "08:00", end: "17:00" });
  const [saving, setSaving] = useState<"hours" | "off" | null>(null);
  const board = useApiQuery(
    queryKeys.shiftBoard(month, monthEnd(month), person.role),
    (signal) => fetchShiftBoard(month, monthEnd(month), person.role, signal),
    { errorMessage: "Could not load the shifts. Try again." },
  );
  const days = board.data?.find((row) => row.person.id === person.id)?.days ?? null;
  const hoursError =
    minutes(hours.end) <= minutes(hours.start) ? "End after the start time." : undefined;
  const count = selected.size;

  function changeMonth(months: number) {
    setMonth((current) => shiftMonth(current, months));
    setSelected(new Set());
  }

  function toggle(date: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  /** Picks the month's days on these weekdays, skipping closed days. */
  function quickPick(weekdays: number[]) {
    const closed = new Set(days?.filter((day) => day.status === "closed").map((day) => day.date));
    setSelected(
      new Set(
        datesOfMonth(month).filter(
          (date) => weekdays.includes(getISODay(parseISO(date))) && !closed.has(date),
        ),
      ),
    );
  }

  async function apply(kind: "hours" | "off") {
    if (count === 0) return;
    setSaving(kind);
    try {
      await saveShiftDays(person.id, {
        dates: [...selected].sort(),
        hours: kind === "hours" ? hours : null,
      });
      feedback.success({
        title: kind === "hours" ? "Shifts set" : "Days off set",
        description:
          kind === "hours"
            ? `${person.firstName} works ${formatTime(hours.start)} – ${formatTime(hours.end)} on ${count} ${count === 1 ? "day" : "days"}.`
            : `${count} ${count === 1 ? "day is" : "days are"} now off for ${person.firstName}.`,
      });
      setSelected(new Set());
      board.reload();
      onSaved();
    } catch (error) {
      feedback.error({
        title: "Couldn't change the shifts",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {person.firstName} {person.lastName}'s shifts
        </SheetTitle>
        <SheetDescription>
          Choose the hours, pick the days, then apply. Leave and holidays show as they are.
        </SheetDescription>
      </SheetHeader>

      <div className="grid gap-5 px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <SelectInputField
            label="From"
            options={timeOptions}
            value={hours.start}
            onValueChange={(start) => setHours((current) => ({ ...current, start }))}
          />
          <SelectInputField
            label="To"
            options={timeOptions}
            value={hours.end}
            onValueChange={(end) => setHours((current) => ({ ...current, end }))}
            error={hoursError}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <p className="min-w-32 text-center text-sm font-medium text-slate-800">
              {format(parseISO(month), "MMMM yyyy")}
            </p>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Quick picks">
            {quickPicks.map((pick) => (
              <Button
                key={pick.label}
                variant="outline"
                size="sm"
                disabled={!days}
                onClick={() => quickPick(pick.weekdays)}
              >
                {pick.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              disabled={count === 0}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>

        {board.error ? (
          <p className="text-sm text-destructive">{board.error}</p>
        ) : (
          <div>
            <MonthCalendar month={month} days={days} selected={selected} onToggle={toggle} />
            <CalendarLegend />
          </div>
        )}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {count === 0
              ? "Click days to pick them. Quick picks skip holidays."
              : `${count} ${count === 1 ? "day" : "days"} picked`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={count === 0 || saving !== null}
              loading={saving === "off"}
              onClick={() => void apply("off")}
            >
              Make days off
            </Button>
            <Button
              disabled={count === 0 || Boolean(hoursError) || saving !== null}
              loading={saving === "hours"}
              onClick={() => void apply("hours")}
            >
              Set {formatTime(hours.start)} – {formatTime(hours.end)}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
