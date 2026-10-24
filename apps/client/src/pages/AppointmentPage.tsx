import { format, parseISO } from "date-fns";
import { CalendarClockIcon, CircleAlertIcon } from "lucide-react";
import { useParams } from "react-router";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";
import { AppointmentLines } from "@/components/appointments/AppointmentLines";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppointment } from "../api/appointments";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import {
  appointmentStatusLabels,
  appointmentStatusVariants,
  eventLabels,
  formatVisit,
} from "../format/appointments";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

/** One appointment: when and where, the tests and prices, what happened, and what can be done. */
export function AppointmentPage() {
  const { id } = useParams();
  const {
    data: appointment,
    error,
    reload,
  } = useApiQuery(
    queryKeys.appointment(id),
    async (signal) => await fetchAppointment(id ?? "", signal),
    { enabled: Boolean(id), errorMessage: "Could not load this appointment." },
  );

  if (error) {
    return (
      <>
        <PageHeader title="Appointment" />
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </>
    );
  }
  if (!appointment) {
    return (
      <>
        <PageHeader title="Appointment" />
        <Skeleton className="h-64" aria-label="Loading the appointment" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={appointment.code}
        action={<AppointmentActions appointment={appointment} onChanged={reload} />}
      />
      {appointment.proposal && (
        <Alert className="mb-6">
          <CalendarClockIcon />
          <AlertTitle>
            New time proposed: {formatVisit(appointment.proposal.date, appointment.proposal.slot)}
          </AlertTitle>
          <AlertDescription>{appointment.proposal.reason}</AlertDescription>
        </Alert>
      )}
      {appointment.decisionNote && ["rejected", "cancelled"].includes(appointment.status) && (
        <Alert variant="destructive" className="mb-6">
          <CircleAlertIcon />
          <AlertTitle>{appointmentStatusLabels[appointment.status]}</AlertTitle>
          <AlertDescription>{appointment.decisionNote}</AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <ContentCard title="Visit" className="lg:col-span-3">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">When</dt>
              <dd className="font-medium">{formatVisit(appointment.date, appointment.slot)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={appointmentStatusVariants[appointment.status]}>
                  {appointmentStatusLabels[appointment.status]}
                </Badge>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Address</dt>
              <dd>
                {appointment.address}
                {appointment.landmark && (
                  <span className="block text-muted-foreground">
                    Landmark: {appointment.landmark}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Patient</dt>
              <dd>
                {appointment.patient.name}
                <span className="block text-muted-foreground">
                  {[appointment.patient.phone, appointment.patient.email]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </dd>
            </div>
            {appointment.notes && (
              <div>
                <dt className="text-muted-foreground">Notes</dt>
                <dd>{appointment.notes}</dd>
              </div>
            )}
            {appointment.cancellableUntil && (
              <div className="sm:col-span-2 text-muted-foreground">
                You can cancel until{" "}
                {format(parseISO(appointment.cancellableUntil), "MMM d, h:mm a")}.
              </div>
            )}
          </dl>
        </ContentCard>
        <ContentCard title="Tests" className="lg:col-span-2">
          <AppointmentLines {...appointment} />
          <p className="mt-3 text-xs text-muted-foreground">Payment: Unpaid</p>
        </ContentCard>
        <ContentCard title="History" className="lg:col-span-5">
          <ol className="space-y-2 text-sm">
            {appointment.events.map((event, index) => (
              <li key={`${event.at}-${index}`} className="flex flex-wrap gap-x-2">
                <span className="text-muted-foreground">
                  {format(parseISO(event.at), "MMM d, yyyy h:mm a")}
                </span>
                <span className="font-medium">{eventLabels[event.kind] ?? event.kind}</span>
                {event.actorName && <span>by {event.actorName}</span>}
                {event.note && <span className="text-muted-foreground">— {event.note}</span>}
              </li>
            ))}
          </ol>
        </ContentCard>
      </div>
    </>
  );
}
