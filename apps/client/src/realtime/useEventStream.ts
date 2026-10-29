import { type AppEvent, appEventSchema } from "@homelabconnect/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../auth/authContext";
import { useFeedback } from "../feedback/feedbackContext";

const EVENT_TYPES: AppEvent["type"][] = ["ticket.message", "ticket.updated"];

/**
 * Listens to /api/events while someone is signed in. Each event refreshes what it touches
 * (tickets, the dashboard), and a message or a ticket handed to you from someone else shows a
 * toast, unless you're already looking at that ticket. If the stream drops, the browser
 * reconnects by itself and everything is refetched, so nothing is missed.
 */
export function useEventStream(): void {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  const { pathname } = useLocation();
  // Read inside the listener, so a new page doesn't reopen the stream
  const latest = useRef({ pathname, feedback });
  useEffect(() => {
    latest.current = { pathname, feedback };
  });
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId || typeof EventSource === "undefined") return;
    const source = new EventSource("/api/events");
    let dropped = false;

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };
    const onEvent = (message: MessageEvent<string>) => {
      const parsed = appEventSchema.safeParse(JSON.parse(message.data));
      if (!parsed.success) return;
      const event = parsed.data;
      refresh();
      if (event.actorId === userId) return;
      const { pathname: current, feedback: notify } = latest.current;
      if (current.endsWith(`/support/tickets/${event.ticketId}`)) return;
      if (event.type === "ticket.message") {
        notify.success({
          title: `New message from ${event.actorName}`,
          description: event.subject,
        });
      } else if (event.change === "assigned" && event.assigneeId === userId) {
        notify.success({ title: "A ticket was assigned to you", description: event.subject });
      }
    };

    for (const type of EVENT_TYPES) source.addEventListener(type, onEvent);
    source.onerror = () => {
      dropped = true;
    };
    source.onopen = () => {
      if (dropped) refresh();
      dropped = false;
    };
    return () => source.close();
  }, [userId, queryClient]);
}
