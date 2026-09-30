import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser } from "../support/renderApp";

const admin = adminUser;

function summary(overrides: Record<string, unknown>) {
  return {
    id: "2b1f7c3e-0a4d-4e8b-9c61-5d2e8f9a7b30",
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
    ...overrides,
  };
}

const self = summary({
  id: admin.id,
  email: admin.email,
  role: "admin",
  firstName: "System",
  lastName: "Admin",
});
const ana = summary({});
const expired = summary({
  id: "5c9a1e2f-3b4d-4c6e-8f70-9a1b2c3d4e5f",
  email: "ben@example.com",
  firstName: "Ben",
  lastName: "Tan",
  mustChangePassword: true,
  temporaryPasswordExpiresAt: "2020-01-01T00:00:00.000Z",
});

const page = (items: unknown[]) => ({
  status: 200,
  body: { items, total: items.length, page: 1, pageSize: 20 },
});

const LIST = "GET /api/users?page=1&pageSize=20";

async function openActions(name: string) {
  await userEvent.click(await screen.findByRole("button", { name: `Actions for ${name}` }));
}

describe("UsersPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
  });

  it("lists users with their status and no actions on your own row", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      [LIST]: () => page([self, ana, expired]),
    });
    renderApp("/app/users/all");

    const table = within(await screen.findByRole("table"));
    const anaRow = (await table.findByText("ana@example.com")).closest("tr")!;
    const benRow = table.getByText("ben@example.com").closest("tr")!;
    const selfRow = table.getByText(admin.email).closest("tr")!;

    expect(within(anaRow).getByText("Active")).toBeInTheDocument();
    expect(within(benRow).getByText("Temp password expired")).toBeInTheDocument();
    expect(within(selfRow).getByText("You")).toBeInTheDocument();
    expect(within(selfRow).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1–3 of 3")).toBeInTheDocument();
  });

  it("filters by search text and role", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      [LIST]: () => page([self, ana, expired]),
      "GET /api/users?q=ben&page=1&pageSize=20": () => page([expired]),
      "GET /api/users?q=ben&role=support&page=1&pageSize=20": () => page([]),
    });
    renderApp("/app/users/all");

    await screen.findByText("ana@example.com");
    await userEvent.type(screen.getByRole("searchbox", { name: "Search users" }), "ben");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Showing 1–1 of 1");
    expect(screen.queryByText("ana@example.com")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("combobox", { name: "Role" }));
    await userEvent.click(await screen.findByRole("option", { name: "Support" }));
    expect(await screen.findByText("No users match these filters.")).toBeInTheDocument();
  });

  it("deactivates a user after confirming in a dialog", async () => {
    let deactivated = false;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      [LIST]: () => page([self, deactivated ? { ...ana, isActive: false } : ana]),
      [`PATCH /api/users/${ana.id}/status`]: (body) => {
        deactivated = (body as { isActive: boolean }).isActive === false;
        return { status: 200, body: { ...ana, isActive: false } };
      },
    });
    renderApp("/app/users/all");

    await openActions("Ana Reyes");
    expect(screen.queryByRole("menuitem", { name: "Reactivate" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "Deactivate" }));

    const confirm = within(await screen.findByRole("alertdialog"));
    expect(confirm.getByText("Deactivate Ana Reyes?")).toBeInTheDocument();
    await userEvent.click(confirm.getByRole("button", { name: "Deactivate" }));

    const result = within(await screen.findByRole("dialog"));
    expect(result.getByText("Account deactivated")).toBeInTheDocument();
    expect(deactivated).toBe(true);
    await userEvent.click(result.getByRole("button", { name: "OK" }));
    const anaRow = (await screen.findByText("Inactive")).closest("tr")!;
    expect(within(anaRow).getByText("ana@example.com")).toBeInTheDocument();
  });

  it("emails a new temporary password to a user whose one expired", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      [LIST]: () => page([expired]),
      [`POST /api/users/${expired.id}/temporary-password`]: () => ({
        status: 200,
        body: {
          user: {
            id: expired.id,
            email: expired.email,
            role: "support",
            firstName: "Ben",
            lastName: "Tan",
            mustChangePassword: true,
          },
          temporaryPasswordExpiresAt: "2030-01-08T08:00:00.000Z",
          emailSent: true,
        },
      }),
    });
    renderApp("/app/users/all");

    await openActions("Ben Tan");
    await userEvent.click(screen.getByRole("menuitem", { name: "Send new temporary password" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Send new password",
      }),
    );

    const result = within(await screen.findByRole("dialog"));
    expect(result.getByText("New temporary password sent")).toBeInTheDocument();
    expect(result.getByText(/temporary password was emailed/)).toHaveTextContent("ben@example.com");
  });

  it("does nothing when the confirmation is cancelled", async () => {
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      [LIST]: () => page([ana]),
    });
    renderApp("/app/users/all");

    await openActions("Ana Reyes");
    await userEvent.click(screen.getByRole("menuitem", { name: "Deactivate" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("shows a failed action in an error dialog", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      [LIST]: () => page([ana]),
      [`PATCH /api/users/${ana.id}/status`]: () => ({
        status: 404,
        body: { error: { code: "user_not_found", message: "User not found." } },
      }),
    });
    renderApp("/app/users/all");

    await openActions("Ana Reyes");
    await userEvent.click(screen.getByRole("menuitem", { name: "Deactivate" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Deactivate" }),
    );

    const result = within(await screen.findByRole("dialog"));
    expect(result.getByText("Couldn't deactivate the account")).toBeInTheDocument();
    expect(result.getByText("User not found.")).toBeInTheDocument();
  });

  it("changes a user's custom role from the actions menu", async () => {
    let sent: unknown;
    const frontDesk = {
      id: "7f1c2e3d-4b5a-4c6d-8e9f-0a1b2c3d4e5f",
      name: "Front Desk",
      baseRole: "support",
      description: null,
      userCount: 0,
      entries: [],
    };
    const medTech = {
      ...frontDesk,
      id: "3a2b1c0d-9e8f-4a7b-8c6d-5e4f3a2b1c0d",
      name: "Senior Med Tech",
      baseRole: "med_team",
    };
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      [LIST]: () => page([ana]),
      "GET /api/roles": () => ({
        status: 200,
        body: { baseRoles: [], customRoles: [frontDesk, medTech] },
      }),
      [`PUT /api/users/${ana.id}/role`]: (body) => {
        sent = body;
        return {
          status: 200,
          body: { ...ana, customRole: { id: frontDesk.id, name: "Front Desk" } },
        };
      },
    });
    renderApp("/app/users/all");

    await openActions("Ana Reyes");
    await userEvent.click(screen.getByRole("menuitem", { name: "Change role" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("combobox", { name: "Custom role" }));
    // Only roles built on Ana's base role (support) are offered.
    expect(screen.queryByRole("option", { name: "Senior Med Tech" })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("option", { name: "Front Desk" }));
    await userEvent.click(dialog.getByRole("button", { name: "Save role" }));

    expect(await screen.findByText("Role changed")).toBeInTheDocument();
    expect(sent).toEqual({ customRoleId: frontDesk.id });
  });

  it("shows support the list but none of the actions they lack permission for", async () => {
    const support = {
      ...sampleUser,
      role: "support" as const,
      permissions: ["dashboard.view", "users.view"],
    };
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: support }),
      [LIST]: () => page([ana, expired]),
    });
    renderApp("/app/users/all");

    expect(await screen.findByText("ana@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create staff" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Actions for/ })).not.toBeInTheDocument();
  });

  it("tells users without users.view they don't have access", async () => {
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
    renderApp("/app/users/all");

    expect(await screen.findByText(/don't have access/)).toBeInTheDocument();
  });
});
