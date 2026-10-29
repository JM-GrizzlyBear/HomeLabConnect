import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser } from "../support/renderApp";

const dashboard = {
  stats: {
    title: "Your summary",
    items: [
      { label: "Upcoming visits", value: "1" },
      { label: "Results ready", value: "2" },
      { label: "Waiting for payment", value: "0" },
      { label: "Balance due", value: "₱700" },
    ],
  },
  donut: {
    title: "Your results",
    segments: [
      { label: "Ready", value: 2 },
      { label: "Pay to view", value: 0 },
      { label: "With the doctor", value: 1 },
    ],
    centerValue: "3",
    centerLabel: "Visits",
  },
  trend: {
    title: "Spending, last 12 months",
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 350, 700],
    tooltipTitle: "This month",
    tooltipValue: "₱700",
  },
  bars: {
    title: "Visits by month",
    headline: "3",
    caption: "Visits this year",
    bars: [
      { label: "J", value: 1 },
      { label: "F", value: 2 },
    ],
    ring: { percent: 67, label: "Paid" },
  },
  breakdown: {
    title: "Tests taken",
    segments: [{ label: "Complete Blood Count", value: 3 }],
    centerValue: "3",
    centerLabel: "Tests",
  },
};

describe("DashboardPage", () => {
  beforeEach(() => localStorage.clear());

  it("shows the user's real numbers, without sample badges", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/dashboard": () => ({ status: 200, body: dashboard }),
    });
    renderApp("/app");

    expect(await screen.findByText("Your summary")).toBeInTheDocument();
    expect(screen.getByText("₱700", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Visits by month")).toBeInTheDocument();
    expect(screen.queryByText(/sample/i)).not.toBeInTheDocument();
  });

  it("says so when the numbers can't load", async () => {
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
    renderApp("/app");
    expect(
      await screen.findByText("Could not load your dashboard. Try again."),
    ).toBeInTheDocument();
  });
});

describe("AuditLogsPage", () => {
  it("lists entries with readable labels and filters by group", async () => {
    const entry = {
      id: "9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
      at: "2026-01-15T08:00:00.000Z",
      actor: null,
      action: "auth.login_failed",
      targetType: "user",
      targetId: null,
      summary: "support@homelabconnect.local",
      ip: "203.0.113.5",
      userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/130.0",
    };
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/audit?*": () => ({
        status: 200,
        body: { items: [entry], total: 1, page: 1, pageSize: 50 },
      }),
    });
    renderApp("/app/audit");

    const row = within((await screen.findByText("support@homelabconnect.local")).closest("tr")!);
    expect(row.getByText("Failed sign-in")).toBeInTheDocument();
    expect(row.getByText("Unknown")).toBeInTheDocument();
    expect(row.getByText("Chrome on Windows")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("combobox", { name: "What" }));
    await userEvent.click(await screen.findByRole("option", { name: "Failed sign-ins" }));
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes("group=failed_sign_ins"))).toBe(
      true,
    );
  });
});
