import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const appointmentId = "3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f";

const appointment = (overrides: Record<string, unknown> = {}) => ({
  id: appointmentId,
  code: "HLC-000001",
  patient: { id: sampleUser.id, name: "Juan Dela Cruz", email: sampleUser.email, phone: null },
  date: "2026-01-17",
  slot: "08:00",
  status: "confirmed",
  address: "12 Rizal St, Makati",
  landmark: null,
  notes: null,
  lines: [
    {
      procedureId: "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e",
      code: "CBC",
      name: "Complete Blood Count",
      priceCentavos: 35_000,
      promotionName: null,
      discountCentavos: 0,
      collected: null,
    },
  ],
  subtotalCentavos: 35_000,
  discountCentavos: 0,
  totalCentavos: 35_000,
  paymentStatus: "unpaid",
  needsRefund: false,
  decisionNote: null,
  team: { id: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", name: "Team Makati" },
  collectionNote: null,
  returnOf: null,
  returnVisits: [],
  routePosition: null,
  proposal: null,
  cancellableUntil: null,
  events: [],
  createdAt: "2026-01-15T08:00:00.000Z",
  ...overrides,
});

const payment = (overrides: Record<string, unknown> = {}) => ({
  id: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
  appointmentId,
  provider: "stripe",
  status: "paid",
  amountCentavos: 35_000,
  refundedCentavos: 0,
  paidAt: "2026-01-15T09:00:00.000Z",
  createdAt: "2026-01-15T08:55:00.000Z",
  refunds: [],
  appointment: {
    code: "HLC-000001",
    date: "2026-01-17",
    status: "cancelled",
    patient: { id: sampleUser.id, name: "Juan Dela Cruz" },
  },
  needsRefund: true,
  ...overrides,
});

const medTeamUser = {
  ...sampleUser,
  id: "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0e",
  role: "med_team" as const,
  permissions: ["visits.view_assigned", "visits.collect", "payments.record_cash"],
};

describe("paying for an appointment", () => {
  beforeEach(() => localStorage.clear());

  it("offers the patient Pay now once confirmed, when card payments are on", async () => {
    let checkouts = 0;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      [`GET /api/appointments/${appointmentId}`]: () => ({ status: 200, body: appointment() }),
      [`GET /api/appointments/${appointmentId}/payments`]: () => ({
        status: 200,
        body: { cardEnabled: true, payments: [] },
      }),
      [`POST /api/appointments/${appointmentId}/checkout`]: () => {
        checkouts += 1;
        return { status: 200, body: { url: "https://checkout.example.com/cs_1" } };
      },
    });
    renderApp(`/app/appointments/${appointmentId}`);

    await userEvent.click(await screen.findByRole("button", { name: "Pay now" }));
    expect(checkouts).toBe(1);
  });

  it("tells the patient to pay in cash when card payments are off", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      [`GET /api/appointments/${appointmentId}`]: () => ({ status: 200, body: appointment() }),
      [`GET /api/appointments/${appointmentId}/payments`]: () => ({
        status: 200,
        body: { cardEnabled: false, payments: [] },
      }),
    });
    renderApp(`/app/appointments/${appointmentId}`);

    expect(await screen.findByText(/Pay in cash to the med team/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pay now" })).not.toBeInTheDocument();
  });

  it("lets the med team record cash after confirming", async () => {
    let paid = false;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: medTeamUser }),
      [`GET /api/appointments/${appointmentId}`]: () => ({
        status: 200,
        body: appointment({ status: "on_the_way", paymentStatus: paid ? "paid" : "unpaid" }),
      }),
      [`GET /api/appointments/${appointmentId}/payments`]: () => ({
        status: 200,
        body: {
          cardEnabled: true,
          payments: paid ? [{ ...payment({ provider: "cash" }), needsRefund: undefined }] : [],
        },
      }),
      [`POST /api/appointments/${appointmentId}/cash`]: () => {
        paid = true;
        return { status: 200, body: appointment({ status: "on_the_way", paymentStatus: "paid" }) };
      },
    });
    renderApp(`/app/appointments/${appointmentId}`);

    await userEvent.click(await screen.findByRole("button", { name: "Record cash payment" }));
    const dialog = within(await screen.findByRole("alertdialog"));
    expect(dialog.getByText("Record ₱350.00 cash?")).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Record cash" }));

    expect(await toasts().findByText("Cash payment recorded")).toBeInTheDocument();
    expect(paid).toBe(true);
  });
});

describe("AllPaymentsPage", () => {
  beforeEach(() => localStorage.clear());

  it("lists payments, flags ones to refund, and refunds part of one", async () => {
    const refunds: unknown[] = [];
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/payments?*": () => ({
        status: 200,
        body: { items: [payment()], total: 1, page: 1, pageSize: 20 },
      }),
      [`POST /api/payments/${payment().id}/refunds`]: (body) => {
        refunds.push(body);
        return {
          status: 200,
          body: payment({ status: "partially_refunded", refundedCentavos: 10_000 }),
        };
      },
    });
    renderApp("/app/payments/all");

    const row = within((await screen.findByRole("link", { name: "HLC-000001" })).closest("tr")!);
    expect(row.getByText("Needs refund")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Export CSV/ })).toHaveAttribute(
      "href",
      "/api/payments/export",
    );

    await userEvent.click(row.getByRole("button", { name: "Refund" }));
    const dialog = within(await screen.findByRole("dialog"));
    const amount = dialog.getByLabelText("Amount (₱)");
    expect(amount).toHaveValue("350.00");

    await userEvent.clear(amount);
    await userEvent.type(amount, "400");
    await userEvent.type(dialog.getByLabelText("Reason"), "Overcharged");
    await userEvent.click(dialog.getByRole("button", { name: "Refund" }));
    expect(await dialog.findByText("At most ₱350.00 is left to refund.")).toBeInTheDocument();

    await userEvent.clear(amount);
    await userEvent.type(amount, "100");
    await userEvent.click(dialog.getByRole("button", { name: "Refund" }));

    expect(await toasts().findByText("Refund recorded")).toBeInTheDocument();
    expect(refunds).toEqual([{ amountCentavos: 10_000, reason: "Overcharged" }]);
  });
});

describe("MyPaymentsPage", () => {
  it("lists the patient's payments and refunds", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/payments/mine": () => ({
        status: 200,
        body: [
          payment({
            status: "partially_refunded",
            refundedCentavos: 5_000,
            refunds: [
              {
                id: "1f2e3d4c-5b6a-4978-8a6b-5c4d3e2f1a0b",
                amountCentavos: 5_000,
                reason: "Senior discount",
                createdAt: "2026-01-16T09:00:00.000Z",
              },
            ],
            needsRefund: false,
          }),
        ],
      }),
    });
    renderApp("/app/payments/mine");

    const list = within(await screen.findByRole("list", { name: "Payments" }));
    expect(list.getByRole("link", { name: "HLC-000001" })).toBeInTheDocument();
    expect(list.getByText("Partly refunded")).toBeInTheDocument();
    expect(list.getByText("Refunded ₱50.00 — Senior discount")).toBeInTheDocument();
  });
});
