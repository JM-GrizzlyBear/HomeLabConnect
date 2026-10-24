import type { BaseRole } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { SelectInputField } from "@/components/form/SelectInputField";
import { type ShiftEditorTarget, ShiftMonthEditor } from "@/components/scheduling/ShiftMonthEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fetchShiftBoard } from "../api/scheduling";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";
import { roleLabels } from "../auth/roleLabels";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { datesFrom, describeDay, describeDayShort, mondayOf, shiftDate } from "../format/schedule";

const ALL = "all";
const roleOptions = [
  { value: ALL, label: "All staff" },
  { value: "med_team", label: roleLabels.med_team },
  { value: "doctor", label: roleLabels.doctor },
  { value: "support", label: roleLabels.support },
  { value: "admin", label: roleLabels.admin },
];

const cellStyles = {
  working: "text-slate-800",
  off: "text-muted-foreground",
  closed: "bg-amber-50 text-amber-800",
  leave: "bg-sky-50 text-sky-800",
};

/** Everyone's week at a glance; shifts.manage opens a person's month to set their shifts. */
export function ShiftsPage() {
  const can = useCan();
  const canManage = can("shifts.manage");
  const [weekStart, setWeekStart] = useState(() => mondayOf());
  const [role, setRole] = useState<BaseRole | typeof ALL>(ALL);
  const [editing, setEditing] = useState<ShiftEditorTarget | null>(null);
  const weekEnd = shiftDate(weekStart, 6);
  const {
    data: rows,
    error,
    reload,
  } = useApiQuery(
    queryKeys.shiftBoard(weekStart, weekEnd, role === ALL ? null : role),
    (signal) => fetchShiftBoard(weekStart, weekEnd, role === ALL ? null : role, signal),
    { errorMessage: "Could not load shifts. Try again." },
  );
  const dates = datesFrom(weekStart, 7);

  return (
    <>
      <PageHeader title="Shifts" />
      <ContentCard
        title={`${format(parseISO(weekStart), "MMM d")} – ${format(parseISO(weekEnd), "MMM d, yyyy")}`}
        action={
          <div className="flex items-center gap-2">
            <SelectInputField
              label="Role"
              hideLabel
              size="sm"
              options={roleOptions}
              value={role}
              onValueChange={(value) => setRole(value as typeof role)}
              className="w-36"
            />
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous week"
              onClick={() => setWeekStart(shiftDate(weekStart, -7))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next week"
              onClick={() => setWeekStart(shiftDate(weekStart, 7))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        }
      >
        {canManage && (
          <p className="mb-4 text-sm text-muted-foreground">
            Click a name to set their shifts for the month, or a day to start with that day picked.
          </p>
        )}
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : rows && rows.length === 0 ? (
          <EmptyState title="No active staff in this role." />
        ) : (
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Staff</TableHead>
                {dates.map((date) => (
                  <TableHead key={date} className="text-center">
                    {format(parseISO(date), "EEE d")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows
                ? rows.map((row) => {
                    const name = `${row.person.firstName} ${row.person.lastName}`;
                    return (
                      <TableRow key={row.person.id}>
                        <TableCell>
                          {canManage ? (
                            <button
                              type="button"
                              className="text-left font-medium text-brand-700 hover:underline"
                              onClick={() => setEditing({ person: row.person, date: weekStart })}
                            >
                              {name}
                            </button>
                          ) : (
                            <span className="font-medium text-slate-800">{name}</span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {roleLabels[row.person.role]}
                          </p>
                        </TableCell>
                        {row.days.map((day) => (
                          <TableCell
                            key={day.date}
                            className={cn("p-1 text-center text-xs", cellStyles[day.status])}
                          >
                            {canManage ? (
                              <button
                                type="button"
                                className="w-full rounded px-1 py-2 hover:bg-muted"
                                aria-label={`${name}, ${format(parseISO(day.date), "EEEE MMM d")}: ${describeDay(day)}`}
                                onClick={() =>
                                  setEditing({ person: row.person, date: day.date, pick: true })
                                }
                              >
                                {describeDayShort(day)}
                              </button>
                            ) : (
                              describeDayShort(day)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                : Array.from({ length: 4 }, (_, i) => (
                    <TableRow key={i} aria-hidden>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-9" />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </ContentCard>

      <ShiftMonthEditor target={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </>
  );
}
