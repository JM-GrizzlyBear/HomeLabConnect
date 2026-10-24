import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../../support/testApp.js";

type TestApp = ReturnType<typeof buildTestApp>;

async function loginAs(app: TestApp["app"], email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password123" });
  return { Authorization: `Bearer ${res.body.token as string}` };
}

async function asAdmin() {
  const testApp = buildTestApp();
  testApp.users.add({ email: "admin@example.com", role: "admin" });
  return { ...testApp, auth: await loginAs(testApp.app, "admin@example.com") };
}

const frontDesk = {
  name: "Front Desk",
  baseRole: "support",
  description: "Support staff who also create staff accounts.",
  entries: [{ key: "users.create", effect: "grant" }],
};

describe("/api/roles", () => {
  it("creates, lists, reads, updates and deletes a custom role", async () => {
    const { app, auth } = await asAdmin();

    const created = await request(app).post("/api/roles").set(auth).send(frontDesk);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...frontDesk, userCount: 0 });
    const id = created.body.id as string;

    const list = await request(app).get("/api/roles").set(auth);
    expect(list.body.customRoles.map((role: { name: string }) => role.name)).toEqual([
      "Front Desk",
    ]);
    expect(
      list.body.baseRoles.find((role: { id: string }) => role.id === "admin").grants,
    ).toHaveLength(67);

    expect((await request(app).get(`/api/roles/${id}`).set(auth)).body.name).toBe("Front Desk");

    const updated = await request(app)
      .put(`/api/roles/${id}`)
      .set(auth)
      .send({ name: "Reception", description: null, entries: [] });
    expect(updated.body).toMatchObject({ name: "Reception", baseRole: "support", entries: [] });

    expect((await request(app).delete(`/api/roles/${id}`).set(auth)).status).toBe(204);
    expect((await request(app).get(`/api/roles/${id}`).set(auth)).status).toBe(404);
  });

  it("returns 409 for a duplicate name and for deleting a role in use", async () => {
    const { app, users, roles, auth } = await asAdmin();
    const role = roles.add({ name: "Front Desk", baseRole: "support" });
    users.add({ email: "ana@example.com", role: "support", customRoleId: role.id });

    const duplicate = await request(app).post("/api/roles").set(auth).send(frontDesk);
    const inUse = await request(app).delete(`/api/roles/${role.id}`).set(auth);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("role_name_taken");
    expect(inUse.status).toBe(409);
    expect(inUse.body.error.code).toBe("role_in_use");
  });

  it("returns 400 for an unknown permission key", async () => {
    const { app, auth } = await asAdmin();

    const res = await request(app)
      .post("/api/roles")
      .set(auth)
      .send({ ...frontDesk, entries: [{ key: "users.fly", effect: "grant" }] });

    expect(res.status).toBe(400);
    expect(res.body.error.issues[0].path).toBe("entries.0.key");
  });

  it("needs roles.view to read and roles.manage to change", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "support@example.com", role: "support" });
    const auth = await loginAs(app, "support@example.com");

    expect((await request(app).get("/api/roles").set(auth)).status).toBe(403);
    expect((await request(app).post("/api/roles").set(auth).send(frontDesk)).status).toBe(403);
  });
});

describe("PUT /api/users/:id/role", () => {
  it("gives a user their custom role's permissions on the next request", async () => {
    const { app, users, roles, auth } = await asAdmin();
    const role = roles.add({
      name: "Front Desk",
      baseRole: "support",
      entries: [{ key: "users.create", effect: "grant" }],
    });
    const ana = users.add({ email: "ana@example.com", role: "support" });
    const anaAuth = await loginAs(app, "ana@example.com");
    const me = () => request(app).get("/api/auth/me").set(anaAuth);
    expect((await me()).body.permissions).not.toContain("users.create");

    const res = await request(app)
      .put(`/api/users/${ana.id}/role`)
      .set(auth)
      .send({ customRoleId: role.id });

    expect(res.status).toBe(200);
    expect(res.body.customRole).toEqual({ id: role.id, name: "Front Desk" });
    expect((await me()).body.permissions).toContain("users.create");
  });

  it("returns 400 for a role built on another base role", async () => {
    const { app, users, roles, auth } = await asAdmin();
    const medTech = roles.add({ name: "Senior Med Tech", baseRole: "med_team" });
    const ana = users.add({ email: "ana@example.com", role: "support" });

    const res = await request(app)
      .put(`/api/users/${ana.id}/role`)
      .set(auth)
      .send({ customRoleId: medTech.id });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("role_mismatch");
  });
});

describe("POST /api/users/staff with a custom role", () => {
  const staff = (customRoleId: string) => ({
    email: "new@example.com",
    firstName: "New",
    lastName: "Hire",
    phone: null,
    role: "support",
    hiredOn: null,
    customRoleId,
  });

  it("creates the account on the custom role", async () => {
    const { app, roles, auth } = await asAdmin();
    const role = roles.add({ name: "Front Desk", baseRole: "support" });

    const res = await request(app).post("/api/users/staff").set(auth).send(staff(role.id));

    expect(res.status).toBe(201);
  });

  it("needs roles.assign as well as users.create", async () => {
    const { app, users, roles, access } = buildTestApp();
    const role = roles.add({ name: "Front Desk", baseRole: "support" });
    const creator = users.add({ email: "support@example.com", role: "support" });
    access.overrides.set(creator.id, [{ key: "users.create", effect: "grant", expiresAt: null }]);
    const auth = await loginAs(app, "support@example.com");

    const res = await request(app).post("/api/users/staff").set(auth).send(staff(role.id));

    expect(res.status).toBe(403);
  });
});
