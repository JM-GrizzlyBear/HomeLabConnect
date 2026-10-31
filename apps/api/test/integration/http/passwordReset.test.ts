import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

const NEW_PASSWORD = "BrandNew2026";

async function setup() {
  const testApp = await buildTestApp();
  const { app, given } = testApp;
  await given.user({ email: "admin@example.com", role: "admin" });
  await given.user({ email: "maria@example.com", firstName: "Maria" });
  const forgot = async (email: string) =>
    await request(app).post("/api/auth/forgot-password").send({ email });
  const reset = async (token: string, newPassword = NEW_PASSWORD) =>
    await request(app).post("/api/auth/reset-password").send({ token, newPassword });
  const login = async (email: string, password: string) =>
    (await request(app).post("/api/auth/login").send({ email, password })).status;
  return { ...testApp, forgot, reset, login };
}

describe("forgot password", () => {
  it("emails a link that sets a new password once and signs out everywhere", async () => {
    const { app, emails, forgot, reset, login } = await setup();
    const elsewhere = await signIn(app, "maria@example.com");

    expect((await forgot("Maria@Example.com")).status).toBe(204);
    expect(emails.resets).toHaveLength(1);
    const [sent] = emails.resets;
    expect(sent).toMatchObject({ to: "maria@example.com", firstName: "Maria" });
    expect(sent!.expiresAt).toEqual(new Date("2026-01-15T09:00:00Z"));

    const done = await reset(sent!.token);
    expect(done.status).toBe(200);
    expect(await login("maria@example.com", "Password123")).toBe(401);
    expect(await login("maria@example.com", NEW_PASSWORD)).toBe(200);
    expect((await request(app).get("/api/auth/me").set(elsewhere)).status).toBe(401);

    const again = await reset(sent!.token, "AnotherOne2026");
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe("invalid_reset_link");
  });

  it("answers the same for unknown and inactive accounts, and sends nothing", async () => {
    const { given, emails, forgot } = await setup();
    await given.user({ email: "gone@example.com", isActive: false });

    expect((await forgot("nobody@example.com")).status).toBe(204);
    expect((await forgot("gone@example.com")).status).toBe(204);
    expect(emails.resets).toEqual([]);
  });

  it("refuses an expired link, a made-up token and a weak password", async () => {
    const { emails, clock, forgot, reset } = await setup();
    await forgot("maria@example.com");
    const { token } = emails.resets[0]!;

    expect((await reset(token, "short")).body.error.code).toBe("invalid_request");
    expect((await reset("x".repeat(43))).body.error.code).toBe("invalid_reset_link");
    clock.advanceMinutes(61);
    expect((await reset(token)).body.error.code).toBe("invalid_reset_link");
  });

  it("clears a pending temporary password and logs both steps", async () => {
    const { app, given, emails, forgot, reset } = await setup();
    await given.user({
      email: "tech@example.com",
      role: "med_team",
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date("2026-01-20T00:00:00Z"),
    });
    await forgot("tech@example.com");
    await reset(emails.resets[0]!.token);

    const signedIn = await request(app)
      .post("/api/auth/login")
      .send({ email: "tech@example.com", password: NEW_PASSWORD });
    expect(signedIn.body.user.mustChangePassword).toBe(false);

    const admin = await signIn(app, "admin@example.com");
    const log = await request(app).get("/api/audit?group=sign_ins").set(admin);
    const actions = log.body.items.map((entry: { action: string }) => entry.action);
    expect(actions).toContain("auth.password_reset_requested");
    expect(actions).toContain("auth.password_reset");
  });

  it("limits reset emails to 5 per 15 minutes", async () => {
    const { forgot } = await setup();
    for (let i = 0; i < 5; i++) expect((await forgot("maria@example.com")).status).toBe(204);
    expect((await forgot("maria@example.com")).status).toBe(429);
  });
});
