import type { AppointmentView } from "@homelabconnect/shared";
import { addDays, format, parseISO } from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  MapIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { EmptyState } from "@/components/data/EmptyState";
import { SelectInputField } from "@/components/form/SelectInputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../api/apiClient";
import { fetchRoute, fetchRouteTeams, reorderRoute } from "../api/appointments";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { useFeedback } from "../feedback/feedbackContext";
import {
  appointmentStatusLabels,
  appointmentStatusVariants,
  mapsLink,
} from "../format/appointments";
import { formatTime } from "../format/settings";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

const iso = (date: Date) => format(date, "yyyy-MM-dd");

/** A team's stops for a day, in order, with directions. Admins can change the order. */
export function DailyRoutePage() {
  const can = useCan();
  const feedback = useFeedback();
  const canManage = can("routes.manage");
  const [date, setDate] = useState(() => iso(new Date()));
  const [pickedTeam, setPickedTeam] = useState("");
  const teams = useApiQuery(
    queryKeys.routeTeams(date),
    async (signal) => await fetchRouteTeams(date, signal),
    { errorMessage: "Could not load the teams. Try again." },
  );
  const teamId =
    teams.data?.find((team) => team.id === pickedTeam)?.id ?? teams.data?.[0]?.id ?? "";
  const route = useApiQuery(
    queryKeys.route(teamId, date),
    async (signal) => await fetchRoute(teamId, date, signal),
    { enabled: Boolean(teamId), errorMessage: "Could not load the route. Try again." },
  );

  async function move(stops: AppointmentView[], index: number, by: -1 | 1) {
    const order = stops.map((stop) => stop.id);
    const [moved] = order.splice(index, 1);
    if (!moved) return;
    order.splice(index + by, 0, moved);
    try {
      await reorderRoute(teamId, date, order);
      feedback.success({ title: "Route updated" });
      route.reload();
    } catch (failure) {
      feedback.error({
        title: "Couldn't change the route",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  const shift = (days: number) => setDate(iso(addDays(parseISO(date), days)));
  const stops = route.data ?? [];

  return (
    <>
      <PageHeader title="Daily Route" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" aria-label="Previous day" onClick={() => shift(-1)}>
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-48 text-center font-medium">
            {format(parseISO(date), "EEEE, MMMM d, yyyy")}
          </span>
          <Button variant="outline" size="sm" aria-label="Next day" onClick={() => shift(1)}>
            <ChevronRightIcon />
          </Button>
        </div>
        {canManage && teams.data && teams.data.length > 0 && (
          <SelectInputField
            label="Team"
            hideLabel
            className="w-56"
            options={teams.data.map((team) => ({ value: team.id, label: team.name }))}
            value={teamId}
            onValueChange={setPickedTeam}
          />
        )}
      </div>

      {teams.error || route.error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{teams.error ?? route.error}</AlertDescription>
        </Alert>
      ) : !teams.data ? (
        <Skeleton className="h-40" aria-label="Loading the route" />
      ) : teams.data.length === 0 ? (
        <ContentCard title="Route">
          <EmptyState
            title={canManage ? "No team is on duty this day." : "You're not on a team this day."}
          />
        </ContentCard>
      ) : (
        <ContentCard title={teams.data.find((team) => team.id === teamId)?.name ?? "Route"}>
          {!route.data ? (
            <Skeleton className="h-32" aria-label="Loading the route" />
          ) : stops.length === 0 ? (
            <EmptyState title="No visits on this route yet." />
          ) : (
            <ol className="divide-y" aria-label="Stops">
              {stops.map((stop, index) => (
                <li key={stop.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {formatTime(stop.slot)} · {stop.patient.name}
                    </span>
                    <span className="block truncate text-muted-foreground">
                      {stop.address}
                      {stop.landmark ? ` · ${stop.landmark}` : ""}
                    </span>
                  </span>
                  <Badge variant={appointmentStatusVariants[stop.status]}>
                    {appointmentStatusLabels[stop.status]}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <a href={mapsLink(stop.address)} target="_blank" rel="noreferrer">
                      <MapIcon />
                      Open in Maps
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/app/appointments/${stop.id}`}>{stop.code}</Link>
                  </Button>
                  {canManage && (
                    <span className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Move ${stop.code} up`}
                        disabled={index === 0}
                        onClick={() => void move(stops, index, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Move ${stop.code} down`}
                        disabled={index === stops.length - 1}
                        onClick={() => void move(stops, index, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </ContentCard>
      )}
    </>
  );
}
