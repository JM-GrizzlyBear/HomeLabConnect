import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const promotion = (overrides: Record<string, unknown> = {}) => ({
  id: "9e4c6a5f-7b8d-4e0f-8a3b-4c5d6e7f8091",
  name: "Senior & PWD Week",
  description: "20% off every test.",
  discountType: "percent",
  value: 20,
  startsOn: "2026-10-01",
  endsOn: null,
  appliesTo: "all",
  procedureIds: [],
  isActive: true,
  status: "running",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

const diabetesCheck = promotion({
  id: "0f5d7b6a-8c9e-4f1a-9b4c-5d6e7f809102",
  name: "Diabetes Check",
  description: null,
  discountType: "fixed",
  value: 20_000,
  startsOn: "2026-11-01",
  endsOn: "2026-11-30",
  appliesTo: "selected",
  procedureIds: ["7c2a4e3d-5f6b-4c8d-8e1f-2a3b4c5d6e7f", "8d3b5f4e-6a7c-4d9e-9f2a-3b4c5d6e7f80"],
  status: "scheduled",
});

describe("PromotionsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lists promotions with their discount, scope, dates and status", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/promotions": () => ({ status: 200, body: [promotion(), diabetesCheck] }),
    });
    renderApp("/app/catalog/promotions");

    const senior = (await screen.findByText("Senior & PWD Week")).closest("tr")!;
    expect(within(senior).getByText("20% off")).toBeInTheDocument();
    expect(within(senior).getByText("All procedures")).toBeInTheDocument();
    expect(within(senior).getByText("Running")).toBeInTheDocument();
    expect(within(senior).getByText(/^From /)).toBeInTheDocument();

    const diabetes = screen.getByText("Diabetes Check").closest("tr")!;
    expect(within(diabetes).getByText("₱200.00 off")).toBeInTheDocument();
    expect(within(diabetes).getByText("2 procedures")).toBeInTheDocument();
    expect(within(diabetes).getByText("Scheduled")).toBeInTheDocument();
  });

  it("turns a promotion off after confirming", async () => {
    let active = true;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/catalog/promotions": () => ({
        status: 200,
        body: [promotion({ isActive: active, status: active ? "running" : "off" })],
      }),
      [`PATCH /api/catalog/promotions/${promotion().id}/status`]: (body) => {
        active = (body as { isActive: boolean }).isActive;
        return { status: 200, body: promotion({ isActive: active, status: "off" }) };
      },
    });
    renderApp("/app/catalog/promotions");

    await userEvent.click(
      await screen.findByRole("button", { name: "Actions for Senior & PWD Week" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Turn off" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Turn off" }),
    );

    expect(await toasts().findByText("Promotion turned off")).toBeInTheDocument();
    expect(await screen.findByText("Off")).toBeInTheDocument();
  });

  it("shows patients what's running, without managing", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/catalog/promotions": () => ({ status: 200, body: [promotion()] }),
    });
    renderApp("/app/catalog/promotions");

    expect(await screen.findByText("Senior & PWD Week")).toBeInTheDocument();
    expect(screen.getByText("Running now")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "New promotion" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Actions for Senior & PWD Week" }),
    ).not.toBeInTheDocument();
  });
});
