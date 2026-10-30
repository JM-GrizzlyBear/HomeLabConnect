import { PERMISSION_KEYS } from "@homelabconnect/shared";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const ANA_ID = "2b1f7c3e-0a4d-4e8b-9c61-5d2e8f9a7b30";
const ana = {
  id: ANA_ID,
  email: "ana@example.com",
  role: "support",
  firstName: "Ana",
  lastName: "Reyes",
  phone: null,
  customRole: null,
  isActive: true,
  mustChangePassword: false,
  temporaryPasswordExpiresAt: null,
  lastLoginAt: null,
  createdAt: "2026-01-10T08:00:00.000Z",
};
const usersPage = { status: 200, body: { items: [ana], total: 1, page: 1, pageSize: 20 } };

describe("forgot password", () => {
  beforeEach(() => localStorage.clear());

  it("asks for an email, then answers the same whether or not it has an account", async () => {
    let asked: unknown = null;
    mockApi({
      "GET /api/auth/me": () => ({ status: 401, body: { error: { code: "unauthenticated" } } }),
      "POST /api/auth/forgot-password": (body) => {
        asked = body;
        return { status: 204 };
      },
    });
    renderApp("/login");

    await userEvent.click(await screen.findByRole("link", { name: "Forgot password?" }));
    await userEvent.click(await screen.findByRole("button", { name: "Send link" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Email"), "maria@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send link" }));
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(asked).toEqual({ email: "maria@example.com" });
  });

  it("sets a new password from the emailed link, then goes to sign in", async () => {
    let sent: unknown = null;
    mockApi({
      "GET /api/auth/me": () => ({ status: 401, body: { error: { code: "unauthenticated" } } }),
      "POST /api/auth/reset-password": (body) => {
        sent = body;
        return { status: 200, body: { userId: sampleUser.id } };
      },
    });
    renderApp("/reset-password?token=abcdefghijklmnopqrstuvwxyz0123456789");

    await userEvent.type(await screen.findByLabelText("New password"), "BrandNew2026");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "Different2026");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));
    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Confirm new password"));
    await userEvent.type(screen.getByLabelText("Confirm new password"), "BrandNew2026");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));

    expect(await toasts().findByText("Password changed. Sign in with it.")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(sent).toEqual({
      token: "abcdefghijklmnopqrstuvwxyz0123456789",
      newPassword: "BrandNew2026",
    });
  });
});

describe("All Users admin tools", () => {
  beforeEach(() => localStorage.clear());

  it("exports with the filters and edits a user, showing a taken email inline", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/users?*": () => usersPage,
      [`PATCH /api/users/${ANA_ID}`]: (body) =>
        (body as { email: string }).email === "taken@example.com"
          ? {
              status: 409,
              body: {
                error: {
                  code: "email_taken",
                  message: "An account with this email already exists.",
                },
              },
            }
          : { status: 200, body: { ...ana, ...(body as object) } },
    });
    renderApp("/app/users/all");

    expect(await screen.findByRole("link", { name: /Export CSV/ })).toHaveAttribute(
      "href",
      "/api/users/export",
    );

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Ana Reyes" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Edit details" }));
    const dialog = within(await screen.findByRole("dialog"));
    const email = dialog.getByLabelText("Email");
    await userEvent.clear(email);
    await userEvent.type(email, "taken@example.com");
    await userEvent.click(dialog.getByRole("button", { name: "Save" }));
    expect(
      await dialog.findByText("An account with this email already exists."),
    ).toBeInTheDocument();

    await userEvent.clear(email);
    await userEvent.type(email, "ana.reyes@example.com");
    await userEvent.click(dialog.getByRole("button", { name: "Save" }));
    expect(await toasts().findByText("User updated")).toBeInTheDocument();
  });

  it("shows one person's permissions and saves an override", async () => {
    const permissions = {
      userId: ANA_ID,
      name: "Ana Reyes",
      role: "support",
      customRole: null,
      permissions: PERMISSION_KEYS.map((key) => ({
        key,
        inherited: key === "payments.view_all",
        granted: key === "payments.view_all",
        source: key === "payments.view_all" ? "base_role" : "none",
      })),
      overrides: [],
    };
    let saved: unknown = null;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/users?*": () => usersPage,
      [`GET /api/users/${ANA_ID}/permissions`]: () => ({ status: 200, body: permissions }),
      [`PUT /api/users/${ANA_ID}/permissions`]: (body) => {
        saved = body;
        return { status: 200, body: permissions };
      },
    });
    renderApp("/app/users/all");

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Ana Reyes" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Permissions" }));
    const sheet = within(await screen.findByRole("dialog"));
    const refunds = await sheet.findByRole("radiogroup", { name: "Issue refunds" });
    await userEvent.click(within(refunds).getByRole("radio", { name: "Allow" }));
    await userEvent.click(sheet.getByRole("button", { name: "Save permissions" }));

    expect(await toasts().findByText("Permissions saved")).toBeInTheDocument();
    expect(saved).toEqual({
      overrides: [{ key: "payments.refund", effect: "grant", until: null }],
    });
  });
});

describe("visit review", () => {
  beforeEach(() => localStorage.clear());

  const APPOINTMENT_ID = "9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
  const appointment = {
    id: APPOINTMENT_ID,
    code: "HLC-000042",
    patient: { id: sampleUser.id, name: "Juan Dela Cruz", email: sampleUser.email, phone: null },
    date: "2026-01-17",
    slot: "08:00",
    status: "collected",
    address: "12 Rizal St, Makati",
    landmark: null,
    notes: null,
    lines: [],
    subtotalCentavos: 35_000,
    discountCentavos: 0,
    totalCentavos: 35_000,
    paymentStatus: "paid",
    needsRefund: false,
    decisionNote: null,
    team: null,
    collectionNote: null,
    returnOf: null,
    returnVisits: [],
    routePosition: null,
    proposal: null,
    cancellableUntil: null,
    events: [],
    createdAt: "2026-01-15T08:00:00.000Z",
  };

  it("lets the patient rate a finished visit once, then shows the rating", async () => {
    let rated: unknown = null;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      [`GET /api/appointments/${APPOINTMENT_ID}`]: () => ({ status: 200, body: appointment }),
      [`GET /api/appointments/${APPOINTMENT_ID}/review`]: () => ({
        status: 200,
        body: rated
          ? { rating: 5, comment: "Very gentle", createdAt: "2026-01-17T09:00:00.000Z" }
          : null,
      }),
      [`POST /api/appointments/${APPOINTMENT_ID}/review`]: (body) => {
        rated = body;
        return { status: 201, body: {} };
      },
    });
    renderApp(`/app/appointments/${APPOINTMENT_ID}`);

    await userEvent.click(await screen.findByRole("radio", { name: "5 stars" }));
    await userEvent.type(screen.getByLabelText(/Comment/), "Very gentle");
    await userEvent.click(screen.getByRole("button", { name: "Send rating" }));

    expect(await toasts().findByText("Thanks for your rating")).toBeInTheDocument();
    expect(rated).toEqual({ rating: 5, comment: "Very gentle" });
    expect(await screen.findByLabelText("5 out of 5 stars")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send rating" })).not.toBeInTheDocument();
  });
});
