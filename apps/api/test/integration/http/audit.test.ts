import request from "supertest";
import { describe, expect, it } from "vitest";
import type { AuditLog } from "../../../src/domain/audit/auditEntry.js";
import { buildTestApp, signIn } from "../support/testApp.js";

async function setup(options: { auditLog?: AuditLog } = {}) {
  const testApp = await buildTestApp(options);
  await testApp.given.user({
    email: "admin@example.com",
    role: "admin",
    firstName: "Ana",
    lastName: "Admin",
  });
  await testApp.given.user({ email: "maria@example.com" });
  return testApp;
}

const audit = async (app: Parameters<typeof request>[0], who: Record<string, string>, query = "") =>
  (await request(app).get(`/api/audit${query}`).set(who)).body as {
    items: {
      action: string;
      actor: { name: string; email: string } | null;
      targetType: string | null;
      targetId: string | null;
      summary: string | null;
      ip: string | null;
      userAgent: string | null;
    }[];
    total: number;
  };

describe("the audit log", () => {
  it("records failed and successful sign-ins, never the password", async () => {
    const { app } = await setup();
    const failed = await request(app)
      .post("/api/auth/login")
      .set("User-Agent", "TestBrowser/1.0")
      .send({ email: "admin@example.com", password: "wrong-password-1" });
    expect(failed.status).toBe(401);
    const asAdmin = await signIn(app, "admin@example.com");

    const log = await audit(app, asAdmin, "?group=failed_sign_ins");
    expect(log.items).toEqual([
      expect.objectContaining({
        action: "auth.login_failed",
        actor: null,
        summary: "admin@example.com",
        userAgent: "TestBrowser/1.0",
      }),
    ]);
    const signIns = await audit(app, asAdmin, "?group=sign_ins");
    expect(signIns.items).toEqual([
      expect.objectContaining({
        action: "auth.login",
        actor: expect.objectContaining({ name: "Ana Admin", email: "admin@example.com" }),
        targetType: "user",
      }),
    ]);
    expect(JSON.stringify(await audit(app, asAdmin))).not.toContain("wrong-password-1");
  });

  it("records admin changes with who, what and which", async () => {
    const { app } = await setup();
    const asAdmin = await signIn(app, "admin@example.com");
    const created = await request(app)
      .post("/api/teams")
      .set(asAdmin)
      .send({ name: "Team Pasig", area: null });
    await request(app)
      .put(`/api/teams/${created.body.id}`)
      .set(asAdmin)
      .send({ name: "Team Pasig East", area: null });

    const log = await audit(app, asAdmin, "?group=scheduling");
    expect(log.items.map((entry) => [entry.action, entry.targetId, entry.summary])).toEqual([
      ["teams.update", created.body.id, "name: Team Pasig East"],
      ["teams.create", created.body.id, "name: Team Pasig"],
    ]);
    expect(log.items[0]!.actor?.email).toBe("admin@example.com");
  });

  it("doesn't record refused changes or reads", async () => {
    const { app } = await setup();
    const asAdmin = await signIn(app, "admin@example.com");
    await request(app).get("/api/teams").set(asAdmin);
    await request(app).post("/api/teams").set(asAdmin).send({ name: "" });
    expect((await audit(app, asAdmin, "?group=scheduling")).total).toBe(0);
  });

  it("searches by actor and pages", async () => {
    const { app } = await setup();
    const asAdmin = await signIn(app, "admin@example.com");
    await signIn(app, "maria@example.com");
    expect((await audit(app, asAdmin, "?q=maria")).items).toHaveLength(1);
    const page = await audit(app, asAdmin, "?pageSize=1&page=2");
    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(1);
  });

  it("is only for audit.view", async () => {
    const { app } = await setup();
    const asPatient = await signIn(app, "maria@example.com");
    expect((await request(app).get("/api/audit").set(asPatient)).status).toBe(403);
  });

  it("never fails the action when the log can't be written", async () => {
    const broken: AuditLog = {
      record: async () => {
        throw new Error("audit store down");
      },
      list: async () => ({ items: [], total: 0 }),
    };
    const { app } = await setup({ auditLog: broken });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "Password123" });
    expect(res.status).toBe(200);
  });
});
