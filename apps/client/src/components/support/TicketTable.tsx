import type { TicketSummary } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  patientTicketStatusLabels,
  ticketCategoryLabels,
  ticketPriorityLabels,
  ticketPriorityVariants,
  ticketStatusLabels,
  ticketStatusVariants,
} from "../../format/support";

interface TicketTableProps {
  tickets: TicketSummary[];
  /** The patient sees whose turn it is; support also sees who, priority and assignee. */
  view: "patient" | "support";
  label: string;
}

export function TicketTable({ tickets, view, label }: TicketTableProps) {
  const support = view === "support";
  const statusLabels = support ? ticketStatusLabels : patientTicketStatusLabels;

  return (
    <Table className="min-w-160" aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket</TableHead>
          {support && <TableHead>Patient</TableHead>}
          <TableHead>Category</TableHead>
          {support && <TableHead>Priority</TableHead>}
          <TableHead>Status</TableHead>
          {support && <TableHead>Agent</TableHead>}
          <TableHead>Last message</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <span className="flex items-center gap-2 font-medium">
                {ticket.subject}
                {ticket.unread > 0 && (
                  <Badge aria-label={`${ticket.unread} unread`}>{ticket.unread}</Badge>
                )}
              </span>
              <p className="text-xs text-muted-foreground">{ticket.code}</p>
            </TableCell>
            {support && <TableCell>{ticket.patient.name}</TableCell>}
            <TableCell>{ticketCategoryLabels[ticket.category]}</TableCell>
            {support && (
              <TableCell>
                <Badge variant={ticketPriorityVariants[ticket.priority]}>
                  {ticketPriorityLabels[ticket.priority]}
                </Badge>
              </TableCell>
            )}
            <TableCell>
              <Badge variant={ticketStatusVariants[ticket.status]}>
                {statusLabels[ticket.status]}
              </Badge>
            </TableCell>
            {support && <TableCell>{ticket.assignee?.name ?? "—"}</TableCell>}
            <TableCell className="text-muted-foreground">
              {format(parseISO(ticket.lastMessageAt), "MMM d, h:mm a")}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" variant="outline">
                <Link to={`/app/support/tickets/${ticket.id}`}>Open</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
