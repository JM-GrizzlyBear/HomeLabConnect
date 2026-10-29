import { defaultBaseGrants } from "@homelabconnect/shared";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { noAccessMessage } from "../../src/components/layout/PageMessage";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const TICKET_ID = "4b3a2c1d-9e8f-4a7b-8c6d-5e4f3a2b1c0d";
const AGENT_ID = "6c5d4e3f-2a1b-4c9d-8e7f-6a5b4c3d2e1f";

const supportUser = {
  ...sampleUser,
  id: AGENT_ID,
  role: "support" as const,
  firstName: "Ana",
  lastName: "Reyes",
  permissions: [...defaultBaseGrants.support] as string[],
};

const summary = {
  id: TICKET_ID,
  code: "TKT-000001",
  subject: "Where are my results?",
  category: "results",
  priority: "normal",
  status: "waiting_on_patient",
  patient: { id: sampleUser.id, name: "Juan Dela Cruz" },
  assignee: { id: AGENT_ID, name: "Ana Reyes" },
  appointment: null,
  lastMessageAt: "2026-01-15T08:05:00.000Z",
  unread: 1,
  createdAt: "2026-01-15T08:00:00.000Z",
};

const message = (id: string, from: "patient" | "agent", body: string) => ({
  id,
  author:
    from === "patient"
      ? { id: sampleUser.id, name: "Juan Dela Cruz" }
      : { id: AGENT_ID, name: "Ana Reyes" },
  fromPatient: from === "patient",
  body,
  attachment: null,
  createdAt: "2026-01-15T08:00:00.000Z",
});

const detail = (changes: Record<string, unknown> = {}) => ({
  ...summary,
  unread: 0,
  patientContact: { email: "juan@example.com", phone: "0917 123 4567" },
  closedAt: null,
  rating: null,
  ratingComment: null,
  canReopen: false,
  messages: [
    message("1f2e3d4c-5b6a-4978-8a1b-2c3d4e5f6a7b", "patient", "It's been three days."),
    {
      ...message("2f2e3d4c-5b6a-4978-8a1b-2c3d4e5f6a7b", "agent", "Here's the lab's note."),
      attachment: {
        filename: "note.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1200,
        url: "/api/support/messages/2f2e3d4c-5b6a-4978-8a1b-2c3d4e5f6a7b/attachment",
      },
    },
  ],
  context: null,
  ...changes,
});

describe("My Tickets", () => {
  beforeEach(() => localStorage.clear());

  it("lists the patient's tickets and opens a new one", async () => {
    let posted: FormData | null = null;
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/support/tickets/mine": () => ({ status: 200, body: [summary] }),
      "GET /api/appointments/mine": () => ({ status: 200, body: [] }),
      "POST /api/support/tickets": (body) => {
        posted = body as FormData;
        return { status: 201, body: { ...summary, id: TICKET_ID, unread: 0 } };
      },
      [`GET /api/support/tickets/${TICKET_ID}`]: () => ({ status: 200, body: detail() }),
    });
    renderApp("/app/support/tickets");

    const table = within(await screen.findByRole("table", { name: "Your tickets" }));
    expect(table.getByText("Where are my results?")).toBeInTheDocument();
    expect(table.getByText("Support replied")).toBeInTheDocument();
    expect(table.getByLabelText("1 unread")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "New ticket" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("button", { name: "Send" }));
    expect(await dialog.findByText("Say what it's about.")).toBeInTheDocument();
    expect(dialog.getByText("Choose a category.")).toBeInTheDocument();
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);

    await userEvent.type(dialog.getByLabelText("Subject"), "Where are my results?");
    await userEvent.click(dialog.getByRole("combobox", { name: "Category" }));
    await userEvent.click(await screen.findByRole("option", { name: "Results" }));
    await userEvent.type(dialog.getByLabelText("Message"), "It's been three days.");
    await userEvent.click(dialog.getByRole("button", { name: "Send" }));

    expect(await toasts().findByText("Ticket sent")).toBeInTheDocument();
    expect(posted!.get("category")).toBe("results");
    expect(posted!.get("appointmentId")).toBeNull();
    // Straight to the new ticket's chat
    expect(await screen.findByRole("list", { name: "Messages" })).toBeInTheDocument();
  });
});

describe("Ticket page", () => {
  beforeEach(() => localStorage.clear());

  it("shows the chat to the patient, sends a reply and closes after confirming", async () => {
    let ticket = detail();
    let sent: FormData | null = null;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      [`GET /api/support/tickets/${TICKET_ID}`]: () => ({ status: 200, body: ticket }),
      [`POST /api/support/tickets/${TICKET_ID}/messages`]: (body) => {
        sent = body as FormData;
        return {
          status: 201,
          body: message("3f2e3d4c-5b6a-4978-8a1b-2c3d4e5f6a7b", "patient", "Thanks!"),
        };
      },
      [`POST /api/support/tickets/${TICKET_ID}/close`]: () => {
        ticket = detail({
          status: "closed",
          closedAt: "2026-01-15T09:00:00.000Z",
          canReopen: true,
        });
        return { status: 204 };
      },
    });
    renderApp(`/app/support/tickets/${TICKET_ID}`);

    const messages = within(await screen.findByRole("list", { name: "Messages" }));
    expect(messages.getByText("It's been three days.")).toBeInTheDocument();
    expect(messages.getByText("You")).toBeInTheDocument();
    expect(messages.getByRole("link", { name: /note\.pdf/ })).toHaveAttribute(
      "href",
      "/api/support/messages/2f2e3d4c-5b6a-4978-8a1b-2c3d4e5f6a7b/attachment",
    );

    await userEvent.type(screen.getByLabelText("Your message"), "Thanks!");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("button", { name: "Send" });
    expect(sent!.get("message")).toBe("Thanks!");

    await userEvent.click(screen.getByRole("button", { name: "Close ticket" }));
    const confirm = within(await screen.findByRole("alertdialog"));
    await userEvent.click(confirm.getByRole("button", { name: "Close ticket" }));
    expect(await toasts().findByText("Ticket closed")).toBeInTheDocument();
    expect(await screen.findByRole("radiogroup", { name: "Rating" })).toBeInTheDocument();
    expect(screen.getByText("Replying reopens this ticket.")).toBeInTheDocument();
  });

  it("takes the patient's rating once the ticket is closed", async () => {
    let rated: unknown = null;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      [`GET /api/support/tickets/${TICKET_ID}`]: () => ({
        status: 200,
        body: detail(
          rated
            ? { status: "closed", rating: 5, ratingComment: "Quick help" }
            : { status: "closed", closedAt: "2026-01-01T09:00:00.000Z" },
        ),
      }),
      [`POST /api/support/tickets/${TICKET_ID}/rating`]: (body) => {
        rated = body;
        return { status: 204 };
      },
    });
    renderApp(`/app/support/tickets/${TICKET_ID}`);

    expect(await screen.findByText(/Open a new ticket if you need more help/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Your message")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    await userEvent.type(screen.getByLabelText(/Comment/), "Quick help");
    await userEvent.click(screen.getByRole("button", { name: "Send rating" }));

    expect(await toasts().findByText("Thanks for your rating")).toBeInTheDocument();
    expect(rated).toEqual({ rating: 5, comment: "Quick help" });
    expect(await screen.findByLabelText("5 out of 5 stars")).toBeInTheDocument();
  });

  it("gives support the patient's context and lets them claim and set the priority", async () => {
    let ticket = detail({
      status: "open",
      assignee: null,
      appointment: { id: "9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d", code: "HLC-000042" },
      context: {
        appointment: {
          id: "9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
          code: "HLC-000042",
          date: "2026-01-17",
          slot: "08:00",
          status: "confirmed",
          totalCentavos: 70_000,
          paymentStatus: "unpaid",
        },
        otherTickets: [
          { ...summary, id: "5b3a2c1d-9e8f-4a7b-8c6d-5e4f3a2b1c0d", subject: "Refund" },
        ],
      },
    });
    let priority: unknown = null;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: supportUser }),
      [`GET /api/support/tickets/${TICKET_ID}`]: () => ({ status: 200, body: ticket }),
      [`POST /api/support/tickets/${TICKET_ID}/claim`]: () => {
        ticket = { ...ticket, status: "assigned", assignee: { id: AGENT_ID, name: "Ana Reyes" } };
        return { status: 204 };
      },
      [`PATCH /api/support/tickets/${TICKET_ID}/priority`]: (body) => {
        priority = body;
        return { status: 204 };
      },
    });
    renderApp(`/app/support/tickets/${TICKET_ID}`);

    expect(await screen.findByRole("link", { name: "HLC-000042" })).toBeInTheDocument();
    expect(screen.getByText("0917 123 4567")).toBeInTheDocument();
    expect(screen.getByText("₱700.00 · Unpaid")).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Their other tickets" })).getByText("Refund"),
    ).toBeInTheDocument();
    // Support can't reassign (support.assign is admin's)
    expect(screen.queryByRole("combobox", { name: "Assigned to" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Claim" }));
    expect(await toasts().findByText("Ticket claimed")).toBeInTheDocument();
    // Claimed: the button goes, and the ticket is theirs
    await vi.waitFor(() =>
      expect(screen.queryByRole("button", { name: "Claim" })).not.toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("combobox", { name: "Priority" }));
    await userEvent.click(await screen.findByRole("option", { name: "High" }));
    expect(await toasts().findByText("Priority changed")).toBeInTheDocument();
    expect(priority).toEqual({ priority: "high" });
  });
});

describe("Ticket Queue", () => {
  beforeEach(() => localStorage.clear());

  it("switches between mine, unassigned and all, with filters", async () => {
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/support/tickets?*": () => ({ status: 200, body: [summary] }),
    });
    renderApp("/app/support/queue");

    const table = within(await screen.findByRole("table", { name: "Tickets" }));
    expect(table.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(table.getByText("Waiting on patient")).toBeInTheDocument();
    const urls = () => fetchSpy.mock.calls.map(([url]) => String(url));
    expect(urls()).toContain("/api/support/tickets?scope=mine&status=active");

    await userEvent.click(screen.getByRole("tab", { name: "Unassigned" }));
    await userEvent.click(screen.getByRole("combobox", { name: "Priority" }));
    await userEvent.click(await screen.findByRole("option", { name: "High" }));
    await userEvent.type(screen.getByLabelText("Search tickets"), "refund");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await screen.findByRole("table", { name: "Tickets" });
    expect(urls()).toContain(
      "/api/support/tickets?scope=unassigned&status=active&priority=high&q=refund",
    );
  });

  it("isn't open to patients", async () => {
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
    renderApp("/app/support/queue");
    expect(await screen.findByText(noAccessMessage)).toBeInTheDocument();
  });
});
