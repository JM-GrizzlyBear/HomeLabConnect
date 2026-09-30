import { defaultBaseGrants, PERMISSION_KEYS } from "@homelabconnect/shared";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser } from "../support/renderApp";

const frontDesk = {
  id: "7f1c2e3d-4b5a-4c6d-8e9f-0a1b2c3d4e5f",
  name: "Front Desk",
  baseRole: "support",
  description: "Support staff who also create accounts.",
  userCount: 0,
  entries: [
    { key: "users.create", effect: "grant" },
    { key: "payments.view_all", effect: "deny" },
  ],
};

const roleList = (customRoles: unknown[] = [frontDesk]) => ({
  status: 200,
  body: {
    baseRoles: [
      { id: "patient", name: "Patient", grants: defaultBaseGrants.patient, userCount: 20 },
      { id: "support", name: "Support", grants: defaultBaseGrants.support, userCount: 1 },
      { id: "admin", name: "Admin", grants: PERMISSION_KEYS, userCount: 2 },
    ],
    customRoles,
  },
});

describe("RolesPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
  });

  it("lists custom roles with what they change, and the base roles", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/roles": () => roleList(),
    });
    renderApp("/app/users/roles");

    const row = (await screen.findByText("Front Desk")).closest("tr")!;
    expect(within(row).getByText("+1 allowed")).toBeInTheDocument();
    expect(within(row).getByText("−1 denied")).toBeInTheDocument();
    expect(within(row).getByText("Support")).toBeInTheDocument();
    const adminRow = screen.getByRole("button", { name: "View Admin permissions" }).closest("tr")!;
    expect(within(adminRow).getByText("All")).toBeInTheDocument();
  });

  it("shows a role's permissions in a side panel", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/roles": () => roleList(),
    });
    renderApp("/app/users/roles");

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Front Desk" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "View permissions" }));

    const sheet = within(await screen.findByRole("dialog"));
    const createRow = sheet.getByText("users.create").closest("li")!;
    expect(within(createRow).getByText(/Allowed/)).toBeInTheDocument();
    const paymentsRow = sheet.getByText("payments.view_all").closest("li")!;
    expect(within(paymentsRow).getByText(/Not allowed/)).toBeInTheDocument();
  });

  it("deletes a role after confirming", async () => {
    let deleted = false;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/roles": () => roleList(deleted ? [] : [frontDesk]),
      [`DELETE /api/roles/${frontDesk.id}`]: () => {
        deleted = true;
        return { status: 204 };
      },
    });
    renderApp("/app/users/roles");

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Front Desk" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete role" }),
    );

    expect(within(await screen.findByRole("dialog")).getByText("Role deleted")).toBeInTheDocument();
    expect(await screen.findByText("No custom roles yet.")).toBeInTheDocument();
  });

  it("shows why a role in use can't be deleted", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/roles": () => roleList(),
      [`DELETE /api/roles/${frontDesk.id}`]: () => ({
        status: 409,
        body: {
          error: {
            code: "role_in_use",
            message: "This role is assigned to 1 user. Move them to another role first.",
          },
        },
      }),
    });
    renderApp("/app/users/roles");

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Front Desk" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete role" }),
    );

    expect(await screen.findByRole("dialog")).toHaveTextContent("assigned to 1 user");
  });

  it("hides editing from users who can only view roles", async () => {
    mockApi({
      "GET /api/auth/me": () => ({
        status: 200,
        body: { ...sampleUser, role: "support", permissions: ["roles.view"] },
      }),
      "GET /api/roles": () => roleList(),
    });
    renderApp("/app/users/roles");

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Front Desk" }));

    expect(screen.getByRole("menuitem", { name: "View permissions" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "New role" })).not.toBeInTheDocument();
  });
});
