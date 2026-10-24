import { describe, expect, it } from "vitest";
import { AssignCustomRole } from "../../../../src/application/access/AssignCustomRole.js";
import { CreateCustomRole } from "../../../../src/application/access/CreateCustomRole.js";
import { DeleteCustomRole } from "../../../../src/application/access/DeleteCustomRole.js";
import { ListRoles } from "../../../../src/application/access/ListRoles.js";
import { UpdateCustomRole } from "../../../../src/application/access/UpdateCustomRole.js";
import {
  CannotChangeOwnRole,
  CustomRoleInUse,
  CustomRoleMismatch,
  CustomRoleNameTaken,
  CustomRoleNotFound,
} from "../../../../src/domain/access/accessErrors.js";
import { InMemoryRoleRepository, InMemoryUserRepository } from "../../../support/fakes.js";

function setup() {
  const users = new InMemoryUserRepository();
  const roles = new InMemoryRoleRepository(users);
  return { users, roles };
}

const newRole = {
  name: "Senior Med Tech",
  baseRole: "med_team" as const,
  description: "Plans routes and approves leave.",
  entries: [{ key: "routes.manage", effect: "grant" as const }],
};

describe("CreateCustomRole", () => {
  it("creates the role with its entries", async () => {
    const { roles } = setup();

    const role = await new CreateCustomRole(roles).execute(newRole);

    expect(role).toMatchObject({ ...newRole, userCount: 0 });
  });

  it("rejects a name already in use, ignoring case", async () => {
    const { roles } = setup();
    roles.add({ name: "Senior Med Tech", baseRole: "med_team" });

    await expect(
      new CreateCustomRole(roles).execute({ ...newRole, name: "senior med tech" }),
    ).rejects.toThrow(CustomRoleNameTaken);
  });
});

describe("UpdateCustomRole", () => {
  it("replaces the name, description and entries", async () => {
    const { roles } = setup();
    const role = roles.add({
      name: "Front Desk",
      baseRole: "support",
      entries: [{ key: "users.create", effect: "grant" }],
    });

    const updated = await new UpdateCustomRole(roles).execute({
      id: role.id,
      name: "Reception",
      description: null,
      entries: [{ key: "appointments.accept", effect: "grant" }],
    });

    expect(updated).toMatchObject({
      name: "Reception",
      baseRole: "support",
      entries: [{ key: "appointments.accept", effect: "grant" }],
    });
  });

  it("allows keeping its own name but not taking another role's", async () => {
    const { roles } = setup();
    const role = roles.add({ name: "Front Desk", baseRole: "support" });
    roles.add({ name: "Reception", baseRole: "support" });
    const update = new UpdateCustomRole(roles);

    await expect(
      update.execute({ id: role.id, name: "front desk", description: null, entries: [] }),
    ).resolves.toMatchObject({ name: "front desk" });
    await expect(
      update.execute({ id: role.id, name: "Reception", description: null, entries: [] }),
    ).rejects.toThrow(CustomRoleNameTaken);
  });

  it("fails for an unknown role", async () => {
    const { roles } = setup();
    await expect(
      new UpdateCustomRole(roles).execute({
        id: "00000000-0000-4000-8000-000000000000",
        name: "X",
        description: null,
        entries: [],
      }),
    ).rejects.toThrow(CustomRoleNotFound);
  });
});

describe("DeleteCustomRole", () => {
  it("deletes a role nobody holds", async () => {
    const { roles } = setup();
    const role = roles.add({ name: "Front Desk", baseRole: "support" });

    await new DeleteCustomRole(roles).execute({ id: role.id });

    expect(roles.roles.has(role.id)).toBe(false);
  });

  it("refuses while someone holds it", async () => {
    const { users, roles } = setup();
    const role = roles.add({ name: "Front Desk", baseRole: "support" });
    users.add({ email: "ana@example.com", role: "support", customRoleId: role.id });

    await expect(new DeleteCustomRole(roles).execute({ id: role.id })).rejects.toThrow(
      CustomRoleInUse,
    );
    expect(roles.roles.has(role.id)).toBe(true);
  });
});

describe("AssignCustomRole", () => {
  function assignSetup() {
    const { users, roles } = setup();
    const admin = users.add({ email: "admin@example.com", role: "admin" });
    const ana = users.add({ email: "ana@example.com", role: "support" });
    const frontDesk = roles.add({ name: "Front Desk", baseRole: "support" });
    return { users, roles, admin, ana, frontDesk, assign: new AssignCustomRole(users, roles) };
  }

  it("puts a user on a matching custom role and back on the base role", async () => {
    const { users, admin, ana, frontDesk, assign } = assignSetup();

    const assigned = await assign.execute({
      actorId: admin.id,
      userId: ana.id,
      customRoleId: frontDesk.id,
    });
    expect(assigned.customRole).toEqual({ id: frontDesk.id, name: "Front Desk" });

    await assign.execute({ actorId: admin.id, userId: ana.id, customRoleId: null });
    expect(users.users.get(ana.id)?.customRoleId).toBeNull();
  });

  it("rejects a role built on another base role", async () => {
    const { roles, admin, ana, assign } = assignSetup();
    const medTech = roles.add({ name: "Senior Med Tech", baseRole: "med_team" });

    await expect(
      assign.execute({ actorId: admin.id, userId: ana.id, customRoleId: medTech.id }),
    ).rejects.toThrow(CustomRoleMismatch);
  });

  it("won't let an admin change their own role", async () => {
    const { roles, admin, assign } = assignSetup();
    const president = roles.add({ name: "President", baseRole: "admin" });

    await expect(
      assign.execute({ actorId: admin.id, userId: admin.id, customRoleId: president.id }),
    ).rejects.toThrow(CannotChangeOwnRole);
  });
});

describe("ListRoles", () => {
  it("lists base roles with their grants and user counts, and custom roles", async () => {
    const { users, roles } = setup();
    users.add({ email: "ana@example.com", role: "support" });
    roles.add({ name: "Front Desk", baseRole: "support" });

    const output = await new ListRoles(roles).execute();

    const support = output.baseRoles.find((role) => role.id === "support");
    expect(support).toMatchObject({ userCount: 1 });
    expect(support?.grants).toContain("users.view");
    expect(output.customRoles.map((role) => role.name)).toEqual(["Front Desk"]);
  });
});
