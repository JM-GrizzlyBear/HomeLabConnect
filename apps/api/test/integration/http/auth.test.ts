import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../../support/testApp.js";

const registration = {
  email: "juan@example.com",
  password: "Password123",
  firstName: "Juan",
  lastName: "Dela Cruz",
  phone: "09171234567",
};

async function loginAs(app: ReturnType<typeof buildTestApp>["app"], email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password123" });
  return res.body.token as string;
}

describe("POST /api/auth/register", () => {
  it("creates a patient account", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/api/auth/register").send(registration);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: "juan@example.com", role: "patient" });
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("returns 409 for a taken email", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com" });

    const res = await request(app).post("/api/auth/register").send(registration);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("email_taken");
  });

  it("returns 400 with the failing fields for an invalid body", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...registration, email: "nope", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_request");
    expect(res.body.error.issues.map((issue: { path: string }) => issue.path)).toEqual(
      expect.arrayContaining(["email", "password"]),
    );
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token and the user", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "juan@example.com", password: "Password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.expiresAt).toBe("2026-01-15T09:00:00.000Z");
    expect(res.body.user.email).toBe("juan@example.com");
  });

  it("returns 401 for wrong credentials", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "juan@example.com", password: "Wrong1234" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("invalid_credentials");
  });

  it("returns 403 for a deactivated account", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com", isActive: false });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "juan@example.com", password: "Password123" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("account_deactivated");
  });
});

describe("GET /api/auth/me", () => {
  it("returns the signed-in user", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com", role: "admin" });
    const token = await loginAs(app, "juan@example.com");

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: "juan@example.com", role: "admin" });
  });

  it("works with a temporary password so the client can prompt for a change", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "new@example.com", role: "support", mustChangePassword: true });
    const token = await loginAs(app, "new@example.com");

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });

  it("returns 401 without a token", async () => {
    const res = await request(buildTestApp().app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthenticated");
  });
});

describe("POST /api/auth/logout", () => {
  it("revokes the session so the token stops working", async () => {
    const { app, users } = buildTestApp();
    users.add({ email: "juan@example.com" });
    const token = await loginAs(app, "juan@example.com");

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(logout.status).toBe(204);
    expect(me.status).toBe(401);
  });
});
