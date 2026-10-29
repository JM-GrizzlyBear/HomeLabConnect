import { formatPeso, type TicketDetail, type TicketPriority } from "@homelabconnect/shared";
import { Link } from "react-router";
import { SelectInputField } from "@/components/form/SelectInputField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "../../api/apiClient";
import {
  claimTicket,
  closeTicket,
  fetchSupportAgents,
  reassignTicket,
  setTicketPriority,
} from "../../api/support";
import { useAuth } from "../../auth/authContext";
import { useCan } from "../../auth/useCan";
import { useFeedback } from "../../feedback/feedbackContext";
import { appointmentStatusLabels, formatVisit } from "../../format/appointments";
import { paymentStatusLabels } from "../../format/payments";
import { ticketPriorityLabels, ticketStatusLabels } from "../../format/support";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { ContentCard } from "../layout/ContentCard";

const priorityOptions = Object.entries(ticketPriorityLabels).map(([value, label]) => ({
  value,
  label,
}));

/** Beside the chat, for support: who's asking, their visit, and what to do with the ticket. */
export function TicketContextPanel({
  ticket,
  onChanged,
}: {
  ticket: TicketDetail;
  onChanged(): void;
}) {
  const can = useCan();
  const { user } = useAuth();
  const feedback = useFeedback();
  const open = ticket.status !== "closed";
  const { data: agents } = useApiQuery(queryKeys.supportAgents, fetchSupportAgents, {
    enabled: open && can("support.assign"),
    errorMessage: "Could not load the agents.",
  });
  const visit = ticket.context?.appointment ?? null;
  const others = ticket.context?.otherTickets ?? [];

  async function run(action: () => Promise<void>, success: string, failure: string) {
    try {
      await action();
      feedback.success({ title: success });
      onChanged();
    } catch (error) {
      feedback.error({
        title: failure,
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  async function close() {
    const confirmed = await feedback.confirm({
      title: "Close this ticket?",
      description: "The patient can still reopen it by replying within a week.",
      confirmLabel: "Close ticket",
    });
    if (confirmed) await run(() => closeTicket(ticket.id), "Ticket closed", "Couldn't close it");
  }

  return (
    <div className="grid content-start gap-6">
      <ContentCard title="Ticket">
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Patient</dt>
            <dd className="font-medium">{ticket.patient.name}</dd>
            <dd>{ticket.patientContact.email}</dd>
            {ticket.patientContact.phone && <dd>{ticket.patientContact.phone}</dd>}
          </div>
          <div>
            <dt className="text-muted-foreground">Agent</dt>
            <dd>{ticket.assignee?.name ?? "Nobody yet"}</dd>
          </div>
          {visit && (
            <div>
              <dt className="text-muted-foreground">Visit</dt>
              <dd>
                <Link
                  to={`/app/appointments/${visit.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {visit.code}
                </Link>{" "}
                · {formatVisit(visit.date, visit.slot)}
              </dd>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="outline">{appointmentStatusLabels[visit.status]}</Badge>
                <Badge variant="outline">
                  {formatPeso(visit.totalCentavos)} · {paymentStatusLabels[visit.paymentStatus]}
                </Badge>
              </dd>
            </div>
          )}
        </dl>

        {open && (
          <div className="mt-5 grid gap-4 border-t pt-4">
            {can("support.handle") && (
              <SelectInputField
                label="Priority"
                options={priorityOptions}
                value={ticket.priority}
                size="sm"
                onValueChange={(priority) =>
                  void run(
                    () => setTicketPriority(ticket.id, priority as TicketPriority),
                    "Priority changed",
                    "Couldn't change the priority",
                  )
                }
              />
            )}
            {can("support.assign") && (
              <SelectInputField
                label="Assigned to"
                options={(agents ?? []).map((agent) => ({ value: agent.id, label: agent.name }))}
                value={ticket.assignee?.id ?? ""}
                placeholder="Choose an agent"
                size="sm"
                onValueChange={(assigneeId) =>
                  void run(
                    () => reassignTicket(ticket.id, assigneeId),
                    "Ticket reassigned",
                    "Couldn't reassign it",
                  )
                }
              />
            )}
            <div className="flex flex-wrap gap-2">
              {can("support.handle") && !ticket.assignee && (
                <Button
                  size="sm"
                  onClick={() =>
                    void run(() => claimTicket(ticket.id), "Ticket claimed", "Couldn't claim it")
                  }
                >
                  Claim
                </Button>
              )}
              {can("support.close") && (
                <Button size="sm" variant="outline" onClick={() => void close()}>
                  Close ticket
                </Button>
              )}
            </div>
            {ticket.assignee && ticket.assignee.id !== user?.id && (
              <p className="text-xs text-muted-foreground">
                {ticket.assignee.name} has this ticket. Replying here also works.
              </p>
            )}
          </div>
        )}
      </ContentCard>

      <ContentCard title="Their other tickets">
        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">None.</p>
        ) : (
          <ul className="grid gap-2 text-sm" aria-label="Their other tickets">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  to={`/app/support/tickets/${other.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {other.subject}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {other.code} · {ticketStatusLabels[other.status]}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ContentCard>
    </div>
  );
}
