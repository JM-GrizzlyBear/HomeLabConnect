/** What changed, pushed live to the people it concerns (the browser refetches what it shows). */
export type AppEvent =
  | {
      type: "ticket.message";
      ticketId: string;
      subject: string;
      actorId: string;
      actorName: string;
    }
  | {
      type: "ticket.updated";
      ticketId: string;
      subject: string;
      actorId: string;
      change: "opened" | "assigned" | "priority" | "closed" | "rated";
      assigneeId: string | null;
    }
  | {
      type: "notification.new";
      id: string;
      title: string;
      body: string;
      link: string;
    };

/**
 * Port: sends an event to everyone in `userIds` who is connected right now. Nobody connected is
 * fine; their page catches up when it next loads. Never throws.
 */
export interface EventPublisher {
  publish(userIds: readonly string[], event: AppEvent): void;
}
