import { defaultBaseGrants, PERMISSION_KEYS } from "@homelabconnect/shared";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp } from "../support/renderApp";

const roleList = {
  status: 200,
  body: {
    baseRoles: [
      { id: "med_team", name: "Med Team", grants: defaultBaseGrants.med_team, userCount: 1 },
      { id: "admin", name: "Admin", grants: PERMISSION_KEYS, userCount: 1 },
    ],
    customRoles: [],
  },
};

const seniorMedTech = {
  id: "3a2b1c0d-9e8f-4a7b-8c6d-5e4f3a2b1c0d",
  name: "Senior Med Tech",
  baseRole: "med_team",
  description: null,
  userCount: 1,
  entries: [{ key: "routes.manage", effect: "grant" }],
};

/** The Inherit / Allow / Deny radio group for one permission. */
const permission = (label: string) => within(screen.getByRole("radiogroup", { name: label }));

describe("RoleEditorPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
  });

  it("creates a role that allows and denies single permissions", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/roles": () => roleList,
      "POST /api/roles": (body) => {
        sent = body;
        return { status: 201, body: { ...seniorMedTech, ...(body as object), userCount: 0 } };
      },
    });
    const router = renderApp("/app/users/roles/new");

    await userEvent.type(await screen.findByLabelText("Name"), "Senior Med Tech");
    await userEvent.click(screen.getByRole("combobox", { name: "Built on" }));
    await userEvent.click(await screen.findByRole("option", { name: "Med Team" }));

    // Med team can view routes by default; allow planning them and deny cash payments.
    expect(permission("Plan daily routes").getByRole("radio", { name: "Inherit" })).toBeChecked();
    await userEvent.click(permission("Plan daily routes").getByRole("radio", { name: "Allow" }));
    await userEvent.click(permission("Record cash payments").getByRole("radio", { name: "Deny" }));
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    expect(within(await screen.findByRole("dialog")).getByText("Role created")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/app/users/roles");
    expect(sent).toEqual({
      name: "Senior Med Tech",
      baseRole: "med_team",
      description: null,
      entries: [
        { key: "routes.manage", effect: "grant" },
        { key: "payments.record_cash", effect: "deny" },
      ],
    });
  });

  it("edits an existing role, with its base role locked", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/roles": () => roleList,
      [`GET /api/roles/${seniorMedTech.id}`]: () => ({ status: 200, body: seniorMedTech }),
      [`PUT /api/roles/${seniorMedTech.id}`]: (body) => {
        sent = body;
        return { status: 200, body: { ...seniorMedTech, ...(body as object) } };
      },
    });
    renderApp(`/app/users/roles/${seniorMedTech.id}`);

    expect(await screen.findByLabelText("Name")).toHaveValue("Senior Med Tech");
    expect(screen.getByRole("combobox", { name: "Built on" })).toBeDisabled();
    expect(permission("Plan daily routes").getByRole("radio", { name: "Allow" })).toBeChecked();

    await userEvent.click(permission("Plan daily routes").getByRole("radio", { name: "Inherit" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(within(await screen.findByRole("dialog")).getByText("Role saved")).toBeInTheDocument();
    expect(sent).toEqual({ name: "Senior Med Tech", description: null, entries: [] });
  });

  it("puts a duplicate name under the name field", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/roles": () => roleList,
      "POST /api/roles": () => ({
        status: 409,
        body: {
          error: { code: "role_name_taken", message: "A role with this name already exists." },
        },
      }),
    });
    renderApp("/app/users/roles/new");

    await userEvent.type(await screen.findByLabelText("Name"), "President");
    await userEvent.click(screen.getByRole("combobox", { name: "Built on" }));
    await userEvent.click(await screen.findByRole("option", { name: "Admin" }));
    await userEvent.click(screen.getByRole("button", { name: "Create role" }));

    expect(await screen.findByLabelText("Name")).toHaveAccessibleDescription(
      "A role with this name already exists.",
    );
  });
});
