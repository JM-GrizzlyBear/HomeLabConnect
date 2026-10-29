import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const appointmentId = "3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f";
const cbcId = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

const appointment = (overrides: Record<string, unknown> = {}) => ({
  id: appointmentId,
  code: "HLC-000001",
  patient: { id: sampleUser.id, name: "Juan Dela Cruz", email: sampleUser.email, phone: null },
  date: "2026-01-17",
  slot: "08:00",
  status: "collected",
  address: "12 Rizal St, Makati",
  landmark: null,
  notes: null,
  lines: [
    {
      procedureId: cbcId,
      code: "CBC",
      name: "Complete Blood Count",
      priceCentavos: 35_000,
      promotionName: null,
      discountCentavos: 0,
      collected: true,
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

const result = (overrides: Record<string, unknown> = {}) => ({
  id: "6f7a8b9c-0d1e-4f2a-8b3c-4d5e6f7a8b9c",
  filename: "cbc.pdf",
  mimeType: "application/pdf",
  sizeBytes: 2048,
  comment: "Within normal range.",
  uploadedBy: { id: "1e2d3c4b-5a69-4788-9a0b-1c2d3e4f5a6b", name: "Dr. Reyes" },
  uploadedAt: "2026-01-18T02:00:00.000Z",
  releasedAt: null,
  fileUrl: "/api/results/6f7a8b9c-0d1e-4f2a-8b3c-4d5e6f7a8b9c/file",
  ...overrides,
});

const doctorUser = {
  ...sampleUser,
  id: "1e2d3c4b-5a69-4788-9a0b-1c2d3e4f5a6b",
  role: "doctor" as const,
  firstName: "Ana",
  lastName: "Reyes",
  permissions: ["appointments.view_all", "results.review", "results.upload", "results.release"],
};

const testRow = (resultValue: unknown) => ({
  procedureId: cbcId,
  code: "CBC",
  name: "Complete Blood Count",
  result: resultValue,
});

describe("results on the appointment page", () => {
  beforeEach(() => localStorage.clear());

  it("lets a doctor upload a result and release it", async () => {
    let uploaded: FormData | null = null;
    let released = false;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: doctorUser }),
      [`GET /api/appointments/${appointmentId}`]: () => ({ status: 200, body: appointment() }),
      [`GET /api/appointments/${appointmentId}/results`]: () => ({
        status: 200,
        body: {
          state: released ? "locked" : "pending",
          canManage: true,
          tests: [
            testRow(
              uploaded
                ? result({ releasedAt: released ? "2026-01-18T03:00:00.000Z" : null })
                : null,
            ),
          ],
        },
      }),
      [`POST /api/appointments/${appointmentId}/results/${cbcId}`]: (body) => {
        uploaded = body as FormData;
        return { status: 204 };
      },
      [`POST /api/appointments/${appointmentId}/results/release`]: () => {
        released = true;
        return { status: 204 };
      },
    });
    renderApp(`/app/appointments/${appointmentId}`);

    await screen.findByRole("button", { name: "Upload" });
    expect(screen.getByRole("button", { name: "Release results" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.upload(
      dialog.getByLabelText("Choose the result file"),
      new File(["%PDF-1.4"], "cbc.pdf", { type: "application/pdf" }),
    );
    await userEvent.type(dialog.getByLabelText(/Comment/), "Within normal range.");
    await userEvent.click(dialog.getByRole("button", { name: "Upload" }));

    expect(await toasts().findByText("Result uploaded")).toBeInTheDocument();
    expect(uploaded!.get("comment")).toBe("Within normal range.");
    expect(await screen.findByText("Draft")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Release results" }));
    const confirm = within(await screen.findByRole("alertdialog"));
    await userEvent.click(confirm.getByRole("button", { name: "Release results" }));
    expect(await toasts().findByText("Results released")).toBeInTheDocument();
    expect(released).toBe(true);
  });

  it("shows the patient locked results with Pay now while unpaid", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      [`GET /api/appointments/${appointmentId}`]: () => ({ status: 200, body: appointment() }),
      [`GET /api/appointments/${appointmentId}/payments`]: () => ({
        status: 200,
        body: { cardEnabled: true, payments: [] },
      }),
      [`GET /api/appointments/${appointmentId}/results`]: () => ({
        status: 200,
        body: { state: "locked", canManage: false, tests: [testRow(null)] },
      }),
    });
    renderApp(`/app/appointments/${appointmentId}`);

    expect(
      await screen.findByText("Your results are ready. Pay to view them."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View" })).not.toBeInTheDocument();
    // One in the Results card, one in the Payment card
    expect(screen.getAllByRole("button", { name: "Pay now" })).toHaveLength(2);
  });

  it("opens released, paid results", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      [`GET /api/appointments/${appointmentId}`]: () => ({
        status: 200,
        body: appointment({ paymentStatus: "paid" }),
      }),
      [`GET /api/appointments/${appointmentId}/results`]: () => ({
        status: 200,
        body: {
          state: "ready",
          canManage: false,
          tests: [testRow(result({ releasedAt: "2026-01-18T03:00:00.000Z" }))],
        },
      }),
    });
    renderApp(`/app/appointments/${appointmentId}`);

    expect(await screen.findByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      result().fileUrl,
    );
    expect(screen.getByText("Within normal range.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload" })).not.toBeInTheDocument();
  });
});

describe("ReviewQueuePage", () => {
  it("lists visits per tab", async () => {
    const item = {
      appointmentId,
      code: "HLC-000001",
      patientName: "Juan Dela Cruz",
      date: "2026-01-17",
      slot: "08:00",
      paymentStatus: "unpaid",
      testsCollected: 2,
      testsWithResults: 1,
      releasedAt: null,
    };
    const page = (items: unknown[]) => ({
      status: 200,
      body: { items, total: items.length, page: 1, pageSize: 20 },
    });
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: doctorUser }),
      "GET /api/results/queue?tab=to_upload*": () => page([item]),
      "GET /api/results/queue?tab=released*": () => page([]),
    });
    renderApp("/app/results/review");

    const row = within((await screen.findByText("HLC-000001")).closest("tr")!);
    expect(row.getByText("1 of 2 uploaded")).toBeInTheDocument();
    expect(row.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      `/app/appointments/${appointmentId}`,
    );

    await userEvent.click(screen.getByRole("tab", { name: "Released" }));
    expect(await screen.findByText("No results released yet.")).toBeInTheDocument();
  });
});

describe("MyResultsPage", () => {
  it("shows which results are ready and which wait for payment", async () => {
    const item = {
      appointmentId,
      code: "HLC-000001",
      patientName: "Juan Dela Cruz",
      date: "2026-01-17",
      slot: "08:00",
      paymentStatus: "unpaid",
      testsCollected: 1,
      testsWithResults: 1,
      releasedAt: "2026-01-18T03:00:00.000Z",
    };
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/results/mine": () => ({
        status: 200,
        body: [
          { ...item, state: "locked" },
          {
            ...item,
            appointmentId: "4d5e6f7a-8b9c-4d0e-8f1a-2b3c4d5e6f7a",
            code: "HLC-000002",
            paymentStatus: "paid",
            state: "ready",
          },
        ],
      }),
    });
    renderApp("/app/results/mine");

    const list = within(await screen.findByRole("list", { name: "Results" }));
    expect(list.getByText("Pay to view")).toBeInTheDocument();
    expect(list.getByText("Ready")).toBeInTheDocument();
    expect(list.getByRole("link", { name: "View results" })).toHaveAttribute(
      "href",
      "/app/appointments/4d5e6f7a-8b9c-4d0e-8f1a-2b3c4d5e6f7a",
    );
  });
});
