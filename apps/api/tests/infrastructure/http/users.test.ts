import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../../support/testApp.js";

type TestApp = ReturnType<typeof buildTestApp>;

async function loginAs(app: TestApp["app"], email: string, password = "Password123") {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token as string;
}

/** A test app with a signed-in admin. */
async function asAdmin() {
  const testApp = buildTestApp();
  const admin = testApp.users.add({ email: "admin@example.com", role: "admin" });
  const token = await loginAs(testApp.app, "admin@example.com");
  const auth = { Authorization: `Bearer ${token}` };
  return { ...testApp, admin, auth };
}

const newStaff = {
  email: "ana@example.com",
  firstName: "Ana",
  lastName: "Reyes",
  phone: "09171234567",
  role: "support",
  hiredOn: null,
};

describe("admin-only access", () => {
  it.each([
    ["get", "/api/users"],
    ["post", "/api/users/staff"],
    ["patch", "/api/users/00000000-0000-4000-8000-000000000000/status"],
    ["post", "/api/users/00000000-0000-4000-8000-000000000000/temporary-password"],
  ] as const)("%s %s returns 401 without a token and 403 for non-admins", async (method, path) => {
    const { app, users } = buildTestApp();
    users.add({ email: "doc@example.com", role: "doctor" });
    const token = await loginAs(app, "doc@example.com");

    expect((await request(app)[method](path)).status).toBe(401);
    const res = await request(app)[method](path).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("forbidden");
  });
});

describe("GET /api/users", () => {
  it("lists users with filters and paging", async () => {
    const { app, users, auth } = await asAdmin();
    users.add({ email: "juan@example.com" });
    users.add({ email: "ana@example.com", role: "support", isActive: false });

    const res = await request(app)
      .get("/api/users")
      .query({ status: "inactive", pageSize: 5 })
      .set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, pageSize: 5 });
    expect(res.body.items[0]).toMatchObject({
      email: "ana@example.com",
      role: "support",
      isActive: false,
      temporaryPasswordExpiresAt: null,
    });
    expect(res.body.items[0]).not.toHaveProperty("passwordHash");
  });

  it("returns 400 for an unknown role filter", async () => {
    const { app, auth } = await asAdmin();

    const res = await request(app).get("/api/users").query({ role: "janitor" }).set(auth);

    expect(res.status).toBe(400);
    expect(res.body.error.issues[0].path).toBe("role");
  });
});

describe("POST /api/users/staff", () => {
  it("creates a staff account and emails a temporary password", async () => {
    const { app, emails, auth } = await asAdmin();

    const res = await request(app).post("/api/users/staff").set(auth).send(newStaff);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      user: { email: "ana@example.com", role: "support", mustChangePassword: true },
      temporaryPasswordExpiresAt: "2026-01-22T08:00:00.000Z",
      emailSent: true,
    });
    expect(res.body).not.toHaveProperty("temporaryPassword");
    expect(emails.sent).toHaveLength(1);
  });

  it("lets the new user sign in only to change the temporary password", async () => {
    const { app, auth } = await asAdmin();
    await request(app).post("/api/users/staff").set(auth).send(newStaff);

    const token = await loginAs(app, "ana@example.com", "Temp0001");
    const profile = await request(app)
      .get("/api/users/me/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(profile.body.error.code).toBe("password_change_required");
  });

  it("returns the temporary password when the email can't be sent", async () => {
    const { app, emails, auth } = await asAdmin();
    emails.failing = true;

    const res = await request(app).post("/api/users/staff").set(auth).send(newStaff);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ emailSent: false, temporaryPassword: "Temp0001" });
  });

  it("returns 409 for an email that's already registered", async () => {
    const { app, users, auth } = await asAdmin();
    users.add({ email: "ana@example.com" });

    const res = await request(app).post("/api/users/staff").set(auth).send(newStaff);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("email_taken");
  });

  it("returns 400 for the patient role", async () => {
    const { app, auth } = await asAdmin();

    const res = await request(app)
      .post("/api/users/staff")
      .set(auth)
      .send({ ...newStaff, role: "patient" });

    expect(res.status).toBe(400);
    expect(res.body.error.issues[0].path).toBe("role");
  });
});

describe("PATCH /api/users/:id/status", () => {
  it("deactivates a user and their open session stops working at once", async () => {
    const { app, users, auth } = await asAdmin();
    const user = users.add({ email: "juan@example.com" });
    const userToken = await loginAs(app, "juan@example.com");

    const res = await request(app)
      .patch(`/api/users/${user.id}/status`)
      .set(auth)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, isActive: false });
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${userToken}`);
    expect(me.status).toBe(401);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "juan@example.com", password: "Password123" });
    expect(login.body.error.code).toBe("account_deactivated");
  });

  it("reactivates a user so they can sign in again", async () => {
    const { app, users, auth } = await asAdmin();
    const user = users.add({ email: "juan@example.com", isActive: false });

    await request(app).patch(`/api/users/${user.id}/status`).set(auth).send({ isActive: true });

    expect(await loginAs(app, "juan@example.com")).toEqual(expect.any(String));
  });

  it("returns 400 when an admin tries to deactivate themselves", async () => {
    const { app, admin, auth } = await asAdmin();

    const res = await request(app)
      .patch(`/api/users/${admin.id}/status`)
      .set(auth)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("cannot_deactivate_self");
  });

  it("returns 400 for a malformed id and 404 for an unknown one", async () => {
    const { app, auth } = await asAdmin();

    const malformed = await request(app)
      .patch("/api/users/not-a-uuid/status")
      .set(auth)
      .send({ isActive: false });
    const unknown = await request(app)
      .patch("/api/users/00000000-0000-4000-8000-000000000000/status")
      .set(auth)
      .send({ isActive: false });

    expect(malformed.status).toBe(400);
    expect(unknown.status).toBe(404);
  });
});

describe("POST /api/users/:id/temporary-password", () => {
  it("replaces an expired temporary password so the user can sign in again", async () => {
    const { app, users, clock, auth } = await asAdmin();
    const user = users.add({
      email: "ana@example.com",
      role: "support",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(clock.now().getTime() - 60_000),
    });

    const expired = await request(app)
      .post("/api/auth/login")
      .send({ email: "ana@example.com", password: "Password123" });
    const res = await request(app).post(`/api/users/${user.id}/temporary-password`).set(auth);

    expect(expired.status).toBe(401);
    expect(expired.body.error.code).toBe("temporary_password_expired");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      user: { id: user.id, mustChangePassword: true },
      temporaryPasswordExpiresAt: "2026-01-22T08:00:00.000Z",
      emailSent: true,
    });
    expect(await loginAs(app, "ana@example.com", "Temp0001")).toEqual(expect.any(String));
  });

  it("returns 403 for a deactivated user", async () => {
    const { app, users, auth } = await asAdmin();
    const user = users.add({ email: "ana@example.com", isActive: false });

    const res = await request(app).post(`/api/users/${user.id}/temporary-password`).set(auth);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("account_deactivated");
  });
});
