import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, toasts } from "../support/renderApp";

const defaults = {
  visitDays: [0, 1, 2, 3, 4, 5, 6],
  visitStart: "06:00",
  visitEnd: "12:00",
  slotMinutes: 60,
  minNoticeHours: 24,
  bookingWindowDays: 30,
  cancelCutoffHours: 24,
  visitsPerTeamPerDay: 8,
  bookingApproval: "staff",
  teamAssignment: "manual",
};

const response = (overrides: Record<string, unknown> = {}) => ({
  status: 200,
  body: { settings: defaults, updatedAt: null, updatedBy: null, ...overrides },
});

const holidays = () => ({
  status: 200,
  body: [
    {
      id: "1b2c3d4e-5f60-4718-8a9b-0c1d2e3f4a5b",
      date: "2026-12-25",
      name: "Christmas Day",
      kind: "holiday",
      repeatsYearly: true,
    },
  ],
});

const HOLIDAYS = `GET /api/holidays?year=${new Date().getFullYear()}`;

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
  });

  it("shows the defaults, with every day open and a link to closed days", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/settings": () => response(),
      [HOLIDAYS]: holidays,
    });
    renderApp("/app/settings");

    expect(await screen.findByRole("checkbox", { name: "Sunday" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Monday" })).toBeChecked();
    expect(screen.getByText("Using the default settings.")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Manage closed days" })).toBeInTheDocument();
  });

  it("saves changes and says who changed them", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/settings": () =>
        sent
          ? response({
              settings: sent,
              updatedAt: "2026-10-01T02:00:00.000Z",
              updatedBy: "System Admin",
            })
          : response(),
      "PUT /api/settings": (body) => {
        sent = body;
        return response({ settings: body });
      },
      [HOLIDAYS]: holidays,
    });
    renderApp("/app/settings");

    await userEvent.click(await screen.findByRole("checkbox", { name: "Sunday" }));
    const notice = screen.getByRole("spinbutton", { name: "Minimum notice (hours)" });
    await userEvent.clear(notice);
    await userEvent.type(notice, "12");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await toasts().findByText("Settings saved")).toBeInTheDocument();
    expect(sent).toMatchObject({ visitDays: [1, 2, 3, 4, 5, 6], minNoticeHours: 12 });
    expect(await screen.findByText(/Last changed by System Admin/)).toBeInTheDocument();
  });

  it("shows a broken rule under its field without saving", async () => {
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/settings": () => response(),
      [HOLIDAYS]: holidays,
    });
    renderApp("/app/settings");

    const window = await screen.findByRole("spinbutton", { name: "Booking window (days ahead)" });
    await userEvent.clear(window);
    await userEvent.type(window, "0");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(screen.getByText("Enter 1–180.")).toBeInTheDocument();
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false);
  });

  it("is read-only without settings.manage", async () => {
    const president = {
      ...adminUser,
      permissions: adminUser.permissions.filter((key) => key !== "settings.manage"),
    };
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: president }),
      "GET /api/settings": () => response(),
      [HOLIDAYS]: holidays,
    });
    renderApp("/app/settings");

    expect(await screen.findByText(/view these settings but not change them/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Monday" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save settings" })).not.toBeInTheDocument();
  });
});
