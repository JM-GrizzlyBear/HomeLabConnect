import type { TicketDetail } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { CircleAlertIcon } from "lucide-react";
import { Link, useParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../api/apiClient";
import { closeTicket, fetchTicket } from "../api/support";
import { useAuth } from "../auth/authContext";
import { useCan } from "../auth/useCan";
import { ContentCard } from "../components/layout/ContentCard";
import { PageHeader } from "../components/layout/PageHeader";
import { ChatComposer } from "../components/support/ChatComposer";
import { ChatThread } from "../components/support/ChatThread";
import { RatingCard } from "../components/support/RatingCard";
import { TicketContextPanel } from "../components/support/TicketContextPanel";
import { useFeedback } from "../feedback/feedbackContext";
import {
  patientTicketStatusLabels,
  ticketCategoryLabels,
  ticketStatusLabels,
  ticketStatusVariants,
} from "../format/support";
import { queryKeys } from "../queries/queryKeys";
import { useApiQuery } from "../queries/useApiQuery";

/** One ticket: the chat, and beside it the patient's details (support) or the ticket's (patient). */
export function TicketPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const can = useCan();
  const {
    data: ticket,
    error,
    reload,
  } = useApiQuery(queryKeys.ticket(id), async (signal) => await fetchTicket(id ?? "", signal), {
    enabled: Boolean(id),
    errorMessage: "Could not load this ticket.",
  });

  if (error || !ticket || !user) {
    return (
      <>
        <PageHeader title="Ticket" />
        {error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Skeleton className="h-64" aria-label="Loading the ticket" />
        )}
      </>
    );
  }

  const isPatient = ticket.patient.id === user.id;
  const closed = ticket.status === "closed";
  const canWrite = isPatient
    ? !closed || ticket.canReopen
    : !closed && can("support.handle") && can("chat.use");
  const statusLabels = isPatient ? patientTicketStatusLabels : ticketStatusLabels;

  return (
    <>
      <PageHeader
        title={ticket.code}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to={isPatient ? "/app/support/tickets" : "/app/support/queue"}>
              {isPatient ? "My tickets" : "Ticket queue"}
            </Link>
          </Button>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <ContentCard title={ticket.subject}>
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={ticketStatusVariants[ticket.status]}>
              {statusLabels[ticket.status]}
            </Badge>
            {ticketCategoryLabels[ticket.category]}
          </p>
          <ChatThread messages={ticket.messages} userId={user.id} />
          {canWrite ? (
            <ChatComposer
              ticketId={ticket.id}
              hint={closed ? "Replying reopens this ticket." : undefined}
              onSent={reload}
            />
          ) : (
            closed && (
              <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
                This ticket is closed.
                {isPatient && " Open a new ticket if you need more help."}
              </p>
            )
          )}
        </ContentCard>
        {isPatient ? (
          <PatientSide ticket={ticket} onChanged={reload} />
        ) : (
          <TicketContextPanel ticket={ticket} onChanged={reload} />
        )}
      </div>
    </>
  );
}

function PatientSide({ ticket, onChanged }: { ticket: TicketDetail; onChanged(): void }) {
  const feedback = useFeedback();
  const closed = ticket.status === "closed";

  async function close() {
    const confirmed = await feedback.confirm({
      title: "Close this ticket?",
      description:
        "Close it once you have what you need. You can reopen it by replying within a week.",
      confirmLabel: "Close ticket",
    });
    if (!confirmed) return;
    try {
      await closeTicket(ticket.id);
      feedback.success({ title: "Ticket closed" });
      onChanged();
    } catch (failure) {
      feedback.error({
        title: "Couldn't close the ticket",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <div className="grid content-start gap-6">
      <ContentCard title="Details">
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Agent</dt>
            <dd>{ticket.assignee?.name ?? "The next available agent"}</dd>
          </div>
          {ticket.appointment && (
            <div>
              <dt className="text-muted-foreground">Visit</dt>
              <dd>
                <Link
                  to={`/app/appointments/${ticket.appointment.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {ticket.appointment.code}
                </Link>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Opened</dt>
            <dd>{format(parseISO(ticket.createdAt), "MMM d, yyyy h:mm a")}</dd>
          </div>
        </dl>
        {!closed && (
          <Button size="sm" variant="outline" className="mt-5" onClick={() => void close()}>
            Close ticket
          </Button>
        )}
      </ContentCard>
      {closed && (
        <RatingCard
          ticketId={ticket.id}
          rating={ticket.rating}
          comment={ticket.ratingComment}
          onRated={onChanged}
        />
      )}
    </div>
  );
}
