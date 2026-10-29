import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminUser, mockApi, renderApp, toasts } from "../support/renderApp";

const TICKET_ID = "4b3a2c1d-9e8f-4a7b-8c6d-5e4f3a2b1c0d";
const MARIA = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

/** Stands in for the browser's EventSource; `emit` plays an event from the server. */
class FakeEventSource {
  static last: FakeEventSource | null = null;
  readonly listeners = new Map<string, (event: MessageEvent<string>) => void>();
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  closed = false;

  constructor(readonly url: string) {
    FakeEventSource.last = this;
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.set(type, listener);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: unknown) {
    this.listeners.get(type)?.(new MessageEvent(type, { data: JSON.stringify(data) }));
  }
}

const newMessage = {
  type: "ticket.message",
  ticketId: TICKET_ID,
  subject: "Where are my results?",
  actorId: MARIA,
  actorName: "Maria Santos",
};

describe("live events", () => {
  beforeEach(() => {
    localStorage.clear();
    FakeEventSource.last = null;
    vi.stubGlobal("EventSource", FakeEventSource);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("opens /api/events once signed in, and toasts a message from someone else", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/dashboard": () => ({ status: 500 }),
    });
    renderApp("/app");
    await screen.findByRole("navigation", { name: "Main" });

    const source = FakeEventSource.last!;
    expect(source.url).toBe("/api/events");
    source.emit("ticket.message", newMessage);
    expect(await toasts().findByText("New message from Maria Santos")).toBeInTheDocument();

    // Your own actions don't toast
    source.emit("ticket.message", { ...newMessage, actorId: adminUser.id, actorName: "You" });
    expect(toasts().queryByText("New message from You")).not.toBeInTheDocument();
  });

  it("rings the bell with a new notification", async () => {
    let unread = 0;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/dashboard": () => ({ status: 500 }),
      "GET /api/notifications?*": () => ({
        status: 200,
        body: { items: [], total: unread, unread, page: 1, pageSize: 10 },
      }),
    });
    renderApp("/app");
    await screen.findByRole("button", { name: "Notifications" });

    unread = 1;
    FakeEventSource.last!.emit("notification.new", {
      type: "notification.new",
      id: "7f6e5d4c-3b2a-4190-8a7b-6c5d4e3f2a1b",
      title: "New booking HLC-000042",
      body: "For Sat, Jan 17 at 8:00 AM. Accept or reject it.",
      link: "/app/appointments/9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
    });

    expect(await toasts().findByText("New booking HLC-000042")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Notifications, 1 unread" }),
    ).toBeInTheDocument();
  });

  it("refreshes the open ticket instead of toasting", async () => {
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [`GET /api/support/tickets/${TICKET_ID}`]: () => ({ status: 500 }),
    });
    renderApp(`/app/support/tickets/${TICKET_ID}`);
    await screen.findByText("Could not load this ticket.");
    const loads = () =>
      fetchSpy.mock.calls.filter(([url]) => String(url) === `/api/support/tickets/${TICKET_ID}`)
        .length;
    const before = loads();

    FakeEventSource.last!.emit("ticket.message", newMessage);

    await vi.waitFor(() => expect(loads()).toBeGreaterThan(before));
    expect(screen.queryByText("New message from Maria Santos")).not.toBeInTheDocument();
  });
});
