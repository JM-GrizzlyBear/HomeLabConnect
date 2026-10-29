import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { noAccessMessage } from "../../src/components/layout/PageMessage";
import { presetRange } from "../../src/format/reports";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const thisMonth = presetRange("this_month");

const revenue = {
  kind: "revenue",
  range: thisMonth,
  period: "day",
  rows: [
    {
      period: thisMonth.from,
      card: 0,
      cash: 56_000,
      refunded: 10_000,
      kept: 46_000,
      payments: 1,
    },
  ],
  totals: { card: 0, cash: 56_000, refunded: 10_000, kept: 46_000, payments: 1 },
  discounts: [{ promotion: "Senior & PWD Discount", centavos: 14_000, tests: 2 }],
};

const tests = {
  kind: "tests",
  range: thisMonth,
  rows: [
    {
      code: "CBC",
      name: "Complete Blood Count",
      category: "Hematology",
      ordered: 2,
      collected: 1,
      revenueCentavos: 28_000,
    },
  ],
  totals: { ordered: 2, collected: 1, revenueCentavos: 28_000 },
  categories: [{ category: "Hematology", ordered: 2, collected: 1, revenueCentavos: 28_000 }],
};

describe("ReportsPage", () => {
  beforeEach(() => localStorage.clear());

  it("runs a report, switches tabs, and exports what's on screen", async () => {
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/reports/saved": () => ({ status: 200, body: [] }),
      "GET /api/reports/revenue?*": () => ({ status: 200, body: revenue }),
      "GET /api/reports/tests?*": () => ({ status: 200, body: tests }),
    });
    renderApp("/app/users/reports");

    const byPeriod = within(await screen.findByRole("table", { name: "Revenue by period" }));
    expect(byPeriod.getByText("Total")).toBeInTheDocument();
    expect(byPeriod.getAllByText("₱460.00")).toHaveLength(2);
    expect(screen.getByRole("table", { name: "Discounts given" })).toHaveTextContent(
      "Senior & PWD Discount",
    );
    expect(screen.getByRole("link", { name: /Export CSV/ })).toHaveAttribute(
      "href",
      `/api/reports/revenue/export?from=${thisMonth.from}&to=${thisMonth.to}&period=day`,
    );

    await userEvent.click(screen.getByRole("button", { name: "This year" }));
    const yearStart = presetRange("this_year").from;
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes(`from=${yearStart}`))).toBe(
      true,
    );

    await userEvent.click(screen.getByRole("tab", { name: "Tests" }));
    expect(await screen.findByRole("table", { name: "Tests" })).toHaveTextContent(
      "Complete Blood Count",
    );
    expect(screen.queryByLabelText("Group by")).not.toBeInTheDocument();
  });

  it("saves a report, refuses a duplicate name inline, and deletes after confirming", async () => {
    let saved: { id: string; name: string }[] = [];
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/reports/revenue?*": () => ({ status: 200, body: revenue }),
      "GET /api/reports/saved": () => ({
        status: 200,
        body: saved.map((report) => ({
          ...report,
          kind: "revenue",
          period: "day",
          preset: "this_month",
          from: null,
          to: null,
          createdAt: "2026-01-15T08:00:00.000Z",
        })),
      }),
      "POST /api/reports/saved": (body) => {
        const { name } = body as { name: string };
        if (saved.some((report) => report.name === name)) {
          return {
            status: 409,
            body: {
              error: {
                code: "saved_report_name_taken",
                message: `You already have a report called "${name}".`,
              },
            },
          };
        }
        const report = { id: "7f6e5d4c-3b2a-4190-8a7b-6c5d4e3f2a1b", name };
        saved = [...saved, report];
        return {
          status: 201,
          body: {
            ...report,
            kind: "revenue",
            period: "day",
            preset: "this_month",
            from: null,
            to: null,
            createdAt: "2026-01-15T08:00:00.000Z",
          },
        };
      },
      "DELETE /api/reports/saved/7f6e5d4c-3b2a-4190-8a7b-6c5d4e3f2a1b": () => {
        saved = [];
        return { status: 204 };
      },
    });
    renderApp("/app/users/reports");

    const saveAs = async (name: string) => {
      await userEvent.click(await screen.findByRole("button", { name: "Save" }));
      const dialog = within(await screen.findByRole("dialog"));
      await userEvent.type(dialog.getByLabelText("Name"), name);
      await userEvent.click(dialog.getByRole("button", { name: "Save" }));
      return dialog;
    };

    await saveAs("Monthly revenue");
    expect(await toasts().findByText("Report saved")).toBeInTheDocument();
    const list = within(await screen.findByRole("list", { name: "Saved reports" }));
    expect(list.getByText("Monthly revenue")).toBeInTheDocument();

    const again = await saveAs("Monthly revenue");
    expect(
      await again.findByText('You already have a report called "Monthly revenue".'),
    ).toBeInTheDocument();
    await userEvent.click(again.getByRole("button", { name: "Back" }));

    await userEvent.click(list.getByRole("button", { name: "Delete Monthly revenue" }));
    const confirm = within(await screen.findByRole("alertdialog"));
    await userEvent.click(confirm.getByRole("button", { name: "Delete" }));
    expect(await toasts().findByText("Saved report deleted")).toBeInTheDocument();
  });

  it("isn't open to patients", async () => {
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
    renderApp("/app/users/reports");
    expect(await screen.findByText(noAccessMessage)).toBeInTheDocument();
  });
});
