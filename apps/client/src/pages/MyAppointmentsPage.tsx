import { format } from "date-fns";
import { CircleAlertIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchMyAppointments } from "../api/appointments";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { isUpcoming } from "../format/appointments";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

/** A patient's own visits: upcoming ones first, past and closed ones on the other tab. */
export function MyAppointmentsPage() {
  const can = useCan();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const { data, error } = useApiQuery(queryKeys.myAppointments, fetchMyAppointments, {
    errorMessage: "Could not load your appointments. Try again.",
  });
  const today = format(new Date(), "yyyy-MM-dd");
  const shown = (data ?? [])
    .filter((appointment) => isUpcoming(appointment, today) === (tab === "upcoming"))
    // Upcoming: soonest first; past: latest first (the API sends latest first)
    .sort((a, b) =>
      tab === "upcoming" ? `${a.date}${a.slot}`.localeCompare(`${b.date}${b.slot}`) : 0,
    );

  return (
    <>
      <PageHeader
        title="My Appointments"
        action={
          can("appointments.book") && (
            <Button asChild>
              <Link to="/app/appointments/book">
                <PlusIcon />
                Book a visit
              </Link>
            </Button>
          )
        }
      />
      <ContentCard title="Visits">
        <Tabs value={tab} onValueChange={(value) => setTab(value as "upcoming" | "past")}>
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past & closed</TabsTrigger>
          </TabsList>
        </Tabs>
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !data ? (
          <Skeleton className="h-32" aria-label="Loading your appointments" />
        ) : shown.length === 0 ? (
          <EmptyState
            title={tab === "upcoming" ? "No upcoming visits." : "Nothing here yet."}
            description={tab === "upcoming" ? "Book a home visit and it shows here." : undefined}
          />
        ) : (
          <ul className="divide-y" aria-label="Appointments">
            {shown.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </ul>
        )}
      </ContentCard>
    </>
  );
}
