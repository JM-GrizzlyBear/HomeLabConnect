import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

const registration = {
  email: "juan@example.com",
  password: "Password123",
  firstName: "Juan",
  lastName: "Dela Cruz",
  phone: "09171234567",
};

describe("POST /api/auth/register", () => {
  it("creates a patient account", async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post("/api/auth/register").send(registration);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: "juan@example.com", role: "patient" });
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("returns 409 for a taken email", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com" });

    const res = await request(app).post("/api/auth/register").send(registration);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("email_taken");
  });

  it("returns 400 with the failing fields for an invalid body", async () => {
    const { app } = await buildTestApp();
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
  it("starts a session in an httpOnly cookie and returns the user", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "juan@example.com", password: "Password123" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: expect.objectContaining({ email: "juan@example.com" }) });
    const cookie = [res.headers["set-cookie"] ?? []].flat().join("; ");
    expect(cookie).toMatch(/^hlc.sid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("returns 401 for wrong credentials", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "juan@example.com", password: "Wrong1234" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("invalid_credentials");
  });

  it("returns 403 for a deactivated account", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com", isActive: false });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "juan@example.com", password: "Password123" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("account_deactivated");
  });
});

describe("GET /api/auth/me", () => {
  it("returns the signed-in user", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com", role: "admin" });
    const auth = await signIn(app, "juan@example.com");

    const res = await request(app).get("/api/auth/me").set(auth);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: "juan@example.com", role: "admin" });
  });

  it("works with a temporary password so the client can prompt for a change", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "new@example.com", role: "support", mustChangePassword: true });
    const auth = await signIn(app, "new@example.com");

    const res = await request(app).get("/api/auth/me").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });

  it("returns 401 when nobody is signed in", async () => {
    const res = await request((await buildTestApp()).app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthenticated");
  });
});

describe("POST /api/auth/logout", () => {
  it("ends the session so the cookie stops working", async () => {
    const { app, given } = await buildTestApp();
    await given.user({ email: "juan@example.com" });
    const auth = await signIn(app, "juan@example.com");

    const logout = await request(app).post("/api/auth/logout").set(auth);
    const me = await request(app).get("/api/auth/me").set(auth);

    expect(logout.status).toBe(204);
    expect(me.status).toBe(401);
  });
});
