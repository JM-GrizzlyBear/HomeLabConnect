import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../support/renderApp";

const APPOINTMENT_ID = "9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

const notification = (id: string, title: string, read: boolean) => ({
  id,
  kind: "confirmed",
  title,
  body: "Our team will see you on Sat, Jan 17 at 8:00 AM.",
  link: `/app/appointments/${APPOINTMENT_ID}`,
  readAt: read ? "2026-01-15T09:00:00.000Z" : null,
  createdAt: "2026-01-15T08:00:00.000Z",
});

const confirmed = notification(
  "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "Visit HLC-000042 confirmed",
  false,
);
const received = notification(
  "2a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "Booking HLC-000042 received",
  true,
);

describe("notifications", () => {
  beforeEach(() => localStorage.clear());

  it("shows the unread count on the bell and opens a notification's page", async () => {
    let read = false;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/dashboard": () => ({ status: 500 }),
      "GET /api/notifications?*": () => ({
        status: 200,
        body: {
          items: [
            read ? { ...confirmed, readAt: "2026-01-15T10:00:00.000Z" } : confirmed,
            received,
          ],
          total: 2,
          unread: read ? 0 : 1,
          page: 1,
          pageSize: 10,
        },
      }),
      [`POST /api/notifications/${confirmed.id}/read`]: () => {
        read = true;
        return { status: 204 };
      },
      [`GET /api/appointments/${APPOINTMENT_ID}`]: () => ({ status: 500 }),
    });
    renderApp("/app");

    const bell = await screen.findByRole("button", { name: "Notifications, 1 unread" });
    await userEvent.click(bell);
    const latest = within(await screen.findByRole("list", { name: "Latest notifications" }));
    expect(latest.getByText("Booking HLC-000042 received")).toBeInTheDocument();
    await userEvent.click(latest.getByText("Visit HLC-000042 confirmed"));

    expect(await screen.findByText("Could not load this appointment.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });

  it("lists everything on the Notifications page, with an Unread tab and Mark all read", async () => {
    let cleared = false;
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "GET /api/notifications?*": () => ({
        status: 200,
        body: {
          items: cleared ? [received] : [confirmed, received],
          total: 2,
          unread: cleared ? 0 : 1,
          page: 1,
          pageSize: 20,
        },
      }),
      "POST /api/notifications/read-all": () => {
        cleared = true;
        return { status: 204 };
      },
    });
    renderApp("/app/notifications");

    const list = within(await screen.findByRole("list", { name: "Notifications" }));
    expect(list.getByText(/Visit HLC-000042 confirmed/)).toHaveTextContent("(unread)");

    await userEvent.click(screen.getByRole("tab", { name: /Unread/ }));
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes("unread=true"))).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(await screen.findByRole("tab", { name: "Unread (0)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
  });
});
