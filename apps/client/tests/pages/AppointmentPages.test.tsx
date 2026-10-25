import { format, parseISO } from "date-fns";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { monthEnd, monthOf } from "../../src/format/schedule";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const cbc = {
  id: "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e",
  code: "CBC",
  name: "Complete Blood Count",
  category: { id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d", name: "Hematology" },
  priceCentavos: 35_000,
  specimen: "blood",
  turnaroundHours: 24,
  fastingHours: 0,
  preparation: null,
  description: null,
  isActive: true,
  promotion: {
    id: "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    name: "January Sale",
    discountedPriceCentavos: 28_000,
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// The last day of this month is open, so the test works whatever today is
const openDate = monthEnd(monthOf());

const line = {
  procedureId: cbc.id,
  code: "CBC",
  name: "Complete Blood Count",
  priceCentavos: 35_000,
  promotionName: "January Sale",
  discountCentavos: 7_000,
  collected: null,
};

const appointment = (overrides: Record<string, unknown> = {}) => ({
  id: "3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f",
  code: "HLC-000001",
  patient: { id: sampleUser.id, name: "Juan Dela Cruz", email: sampleUser.email, phone: null },
  date: openDate,
  slot: "08:00",
  status: "pending",
  address: "12 Rizal St, Makati",
  landmark: null,
  notes: null,
  lines: [line],
  subtotalCentavos: 35_000,
  discountCentavos: 7_000,
  totalCentavos: 28_000,
  paymentStatus: "unpaid",
  decisionNote: null,
  team: null,
  collectionNote: null,
  proposal: null,
  cancellableUntil: "2099-01-01T00:00:00.000Z",
  events: [
    { at: "2026-01-15T08:00:00.000Z", actorName: "Juan Dela Cruz", kind: "booked", note: null },
  ],
  createdAt: "2026-01-15T08:00:00.000Z",
  ...overrides,
});

describe("BookVisitPage", () => {
  beforeEach(() => localStorage.clear());

  it("books tests for an open day and time, with the profile address", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/users/me/profile": () => ({
        status: 200,
        body: {
          id: sampleUser.id,
          email: sampleUser.email,
          role: "patient",
          firstName: "Juan",
          lastName: "Dela Cruz",
          phone: "09171234567",
          patient: { birthDate: null, address: "12 Rizal St, Makati" },
        },
      }),
      "GET /api/catalog/procedures*": () => ({
        status: 200,
        body: { items: [cbc], total: 1, page: 1, pageSize: 100 },
      }),
      "GET /api/appointments/quote*": () => ({
        status: 200,
        body: {
          lines: [line],
          subtotalCentavos: 35_000,
          discountCentavos: 7_000,
          totalCentavos: 28_000,
        },
      }),
      "GET /api/appointments/availability*": () => ({
        status: 200,
        body: [
          {
            date: openDate,
            closedReason: null,
            label: null,
            slots: [
              { start: "07:00", left: 0 },
              { start: "08:00", left: 2 },
            ],
          },
        ],
      }),
      "POST /api/appointments": (body) => {
        sent = body;
        return { status: 201, body: appointment() };
      },
      "GET /api/appointments/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f": () => ({
        status: 200,
        body: appointment(),
      }),
    });
    const router = renderApp("/app/appointments/book");

    await userEvent.click(await screen.findByRole("checkbox"));
    const total = within((await screen.findByText("Total")).parentElement as HTMLElement);
    expect(total.getByText("₱280.00")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Next: date/ }));

    const dayLabel = `${format(parseISO(openDate), "EEEE, MMMM d")}: 2 open`;
    await userEvent.click(await screen.findByRole("button", { name: dayLabel }));
    expect(screen.getByRole("button", { name: /7:00 AM/ })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /8:00 AM/ }));
    await userEvent.click(screen.getByRole("button", { name: /Next: address/ }));

    expect(screen.getByLabelText("Address")).toHaveValue("12 Rizal St, Makati");
    await userEvent.type(screen.getByLabelText(/Landmark/), "Blue gate");
    await userEvent.click(screen.getByRole("button", { name: "Book visit" }));

    expect(await toasts().findByText("Visit booked")).toBeInTheDocument();
    expect(sent).toEqual({
      procedureIds: [cbc.id],
      date: openDate,
      slot: "08:00",
      address: "12 Rizal St, Makati",
      landmark: "Blue gate",
      notes: null,
    });
    expect(router.state.location.pathname).toBe(`/app/appointments/${appointment().id}`);
  });
});

describe("MyAppointmentsPage", () => {
  beforeEach(() => localStorage.clear());

  it("lists upcoming visits and cancels one after confirming", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/appointments/mine": () => ({ status: 200, body: [appointment()] }),
      "GET /api/appointments/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f": () => ({
        status: 200,
        body: appointment(),
      }),
      "PATCH /api/appointments/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f/cancel": () => ({
        status: 200,
        body: appointment({ status: "cancelled", cancellableUntil: null }),
      }),
    });
    renderApp("/app/appointments/mine");

    await userEvent.click(await screen.findByText(/HLC-000001/));
    await userEvent.click(await screen.findByRole("button", { name: "Cancel visit" }));
    const dialog = within(await screen.findByRole("alertdialog"));
    await userEvent.click(dialog.getByRole("button", { name: "Cancel visit" }));

    expect(await toasts().findByText("Visit cancelled")).toBeInTheDocument();
  });
});

describe("AllAppointmentsPage", () => {
  beforeEach(() => localStorage.clear());

  it("shows pending bookings and accepts or rejects them", async () => {
    let rejected: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/appointments*": () => ({
        status: 200,
        body: { items: [appointment()], total: 1, page: 1, pageSize: 20 },
      }),
      "POST /api/appointments/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f/accept": () => ({
        status: 200,
        body: appointment({ status: "confirmed" }),
      }),
      "POST /api/appointments/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f/reject": (body) => {
        rejected = body;
        return { status: 200, body: appointment({ status: "rejected" }) };
      },
    });
    renderApp("/app/appointments/all");

    const row = within((await screen.findByText("HLC-000001")).closest("tr") as HTMLElement);
    await userEvent.click(row.getByRole("button", { name: "Accept" }));
    expect(await toasts().findByText("Booking confirmed")).toBeInTheDocument();

    await userEvent.click(row.getByRole("button", { name: "Reject" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.type(dialog.getByLabelText("Reason"), "No team can reach that area.");
    await userEvent.click(dialog.getByRole("button", { name: "Reject booking" }));

    expect(await toasts().findByText("Booking rejected")).toBeInTheDocument();
    expect(rejected).toEqual({ reason: "No team can reach that area." });
  });
});

describe("assigning a team", () => {
  beforeEach(() => localStorage.clear());

  it("lists the teams on duty and assigns a free one", async () => {
    let sent: unknown;
    const confirmed = appointment({ status: "confirmed", cancellableUntil: null });
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [`GET /api/appointments/${confirmed.id}`]: () => ({ status: 200, body: confirmed }),
      [`GET /api/appointments/${confirmed.id}/teams`]: () => ({
        status: 200,
        body: [
          {
            teamId: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
            name: "Team Makati",
            visitsThatDay: 3,
            available: true,
          },
          {
            teamId: "6f7a8b9c-0d1e-4f2a-8b3c-4d5e6f7a8b9c",
            name: "Team QC",
            visitsThatDay: 1,
            available: false,
          },
        ],
      }),
      [`PUT /api/appointments/${confirmed.id}/team`]: (body) => {
        sent = body;
        return {
          status: 200,
          body: {
            ...confirmed,
            team: { id: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", name: "Team Makati" },
          },
        };
      },
    });
    renderApp(`/app/appointments/${confirmed.id}`);

    await userEvent.click(await screen.findByRole("button", { name: "Assign team" }));
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByRole("radio", { name: /Team QC/ })).toBeDisabled();
    await userEvent.click(dialog.getByRole("radio", { name: /Team Makati/ }));
    await userEvent.click(dialog.getByRole("button", { name: "Save" }));

    expect(await toasts().findByText("Team Makati assigned")).toBeInTheDocument();
    expect(sent).toEqual({ teamId: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b" });
  });
});

describe("MyVisitsPage", () => {
  beforeEach(() => localStorage.clear());

  it("records a visit: on the way, then the tests collected", async () => {
    const medTeamUser = {
      ...sampleUser,
      id: "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0e",
      role: "med_team" as const,
      permissions: ["visits.view_assigned", "visits.collect"],
    };
    let status = "confirmed";
    const recorded: unknown[] = [];
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: medTeamUser }),
      "GET /api/visits/mine*": () => ({
        status: 200,
        body: [
          appointment({
            status,
            cancellableUntil: null,
            team: { id: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", name: "Team Makati" },
          }),
        ],
      }),
      [`POST /api/visits/${appointment().id}`]: (body) => {
        recorded.push(body);
        status = (body as { outcome: string }).outcome;
        return { status: 200, body: appointment({ status }) };
      },
    });
    renderApp("/app/appointments/visits");

    await userEvent.click(await screen.findByRole("button", { name: "On the way" }));
    await userEvent.click(await screen.findByRole("button", { name: "Collected" }));
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByRole("checkbox")).toBeChecked();
    await userEvent.type(dialog.getByLabelText(/Note/), "All good.");
    await userEvent.click(dialog.getByRole("button", { name: "Save" }));

    expect(await toasts().findByText("Visit recorded")).toBeInTheDocument();
    expect(recorded).toEqual([
      { outcome: "on_the_way" },
      { outcome: "collected", collectedProcedureIds: [cbc.id], note: "All good." },
    ]);
  });
});
