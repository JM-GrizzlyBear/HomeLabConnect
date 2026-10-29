import { CircleAlertIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/data/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyTickets } from "../api/support";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { NewTicketDialog } from "../components/support/NewTicketDialog";
import { TicketTable } from "../components/support/TicketTable";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

/** The patient's tickets, and a way to open a new one. */
export function MyTicketsPage() {
  const can = useCan();
  const [creating, setCreating] = useState(false);
  const { data: tickets, error } = useApiQuery(queryKeys.myTickets, fetchMyTickets, {
    errorMessage: "Could not load your tickets. Try again.",
  });

  return (
    <>
      <PageHeader
        title="My Tickets"
        action={
          can("support.create_ticket") && (
            <Button onClick={() => setCreating(true)}>
              <PlusIcon />
              New ticket
            </Button>
          )
        }
      />
      <ContentCard title="Your tickets">
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !tickets ? (
          <Skeleton className="h-40" aria-label="Loading your tickets" />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            description="Questions about a visit, a payment or your results? Open a ticket and our team will chat with you here."
          />
        ) : (
          <TicketTable tickets={tickets} view="patient" label="Your tickets" />
        )}
      </ContentCard>
      <NewTicketDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
