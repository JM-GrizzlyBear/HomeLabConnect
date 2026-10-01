import type { ClosedDay } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { CircleAlertIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { ActionsMenu } from "@/components/ActionsMenu";
import { EmptyState } from "@/components/data/EmptyState";
import { SelectInputField } from "@/components/form/SelectInputField";
import { ClosedDayDialog, type ClosedDayDialogTarget } from "@/components/settings/ClosedDayDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../api/apiClient";
import { deleteClosedDay, fetchClosedDays } from "../api/settings";
import { useApiData } from "../api/useApiData";
import { useAuth } from "../auth/authContext";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import { closedDayKindLabels } from "../format/settings";

/** A closed day placed in the year being viewed (a yearly one moves to that year). */
interface Occurrence {
  closedDay: ClosedDay;
  date: string;
}

function occurrencesIn(year: number, closedDays: readonly ClosedDay[]): Occurrence[] {
  return closedDays
    .map((closedDay) => ({
      closedDay,
      date: closedDay.repeatsYearly ? `${year}-${closedDay.date.slice(5)}` : closedDay.date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Holidays and special days off: dates nobody can book. */
export function HolidaysPage() {
  const { token } = useAuth();
  const feedback = useFeedback();
  const can = useCan();
  const canManage = can("holidays.manage");
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [editing, setEditing] = useState<ClosedDayDialogTarget>(null);
  const { data, error, reload } = useApiData(
    (authToken, signal) => fetchClosedDays(authToken, year, signal),
    [year],
    { errorMessage: "Could not load the closed days. Try again." },
  );

  const yearOptions = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2].map((option) => ({
    value: String(option),
    label: String(option),
  }));
  // "2026-12" → that month's closed days, in date order.
  const months = new Map<string, Occurrence[]>();
  for (const occurrence of occurrencesIn(year, data ?? [])) {
    const month = occurrence.date.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), occurrence]);
  }

  async function remove(closedDay: ClosedDay) {
    const confirmed = await feedback.confirm({
      title: `Remove ${closedDay.name}?`,
      description: closedDay.repeatsYearly
        ? "This opens the date for booking again in every year."
        : "This opens the date for booking again.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed || !token) return;
    try {
      await deleteClosedDay(token, closedDay.id);
      feedback.success({
        title: "Closed day removed",
        description: `${closedDay.name} is open again.`,
      });
      reload();
    } catch (failure) {
      feedback.error({
        title: "Couldn't remove the closed day",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Holidays & Closed Days"
        action={
          canManage && (
            <Button onClick={() => setEditing("new")}>
              <PlusIcon />
              Add closed day
            </Button>
          )
        }
      />

      <ContentCard
        title={`Closed in ${year}`}
        action={
          <SelectInputField
            label="Year"
            hideLabel
            size="sm"
            options={yearOptions}
            value={String(year)}
            onValueChange={(value) => setYear(Number(value))}
            className="w-28"
          />
        }
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Patients can't book a visit on these days. Yearly ones repeat on the same date every year.
        </p>
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !data ? (
          <div className="grid gap-2" aria-label="Loading closed days">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : months.size === 0 ? (
          <EmptyState
            title={`Nothing is closed in ${year}.`}
            description="Add holidays and special days off so patients can't book them."
          />
        ) : (
          <div className="grid gap-5">
            {[...months].map(([month, occurrences]) => (
              <section key={month} aria-label={format(parseISO(`${month}-01`), "MMMM yyyy")}>
                <h3 className="mb-1 border-b pb-1.5 text-sm font-semibold text-slate-800">
                  {format(parseISO(`${month}-01`), "MMMM")}
                </h3>
                <ul className="divide-y divide-slate-100">
                  {occurrences.map(({ closedDay, date }) => (
                    <li key={closedDay.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-24 shrink-0 text-sm tabular-nums text-slate-700">
                        {format(parseISO(date), "EEE, MMM d")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                        {closedDay.name}
                      </span>
                      <Badge variant={closedDay.kind === "holiday" ? "warning" : "secondary"}>
                        {closedDayKindLabels[closedDay.kind]}
                      </Badge>
                      {closedDay.repeatsYearly && <Badge variant="outline">Yearly</Badge>}
                      <ActionsMenu
                        label={`Actions for ${closedDay.name}`}
                        items={[
                          {
                            label: "Edit",
                            icon: <PencilIcon />,
                            hidden: !canManage,
                            onSelect: () => setEditing(closedDay),
                          },
                          {
                            label: "Remove",
                            icon: <Trash2Icon />,
                            destructive: true,
                            hidden: !canManage,
                            onSelect: () => void remove(closedDay),
                          },
                        ]}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </ContentCard>

      <ClosedDayDialog target={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </>
  );
}
