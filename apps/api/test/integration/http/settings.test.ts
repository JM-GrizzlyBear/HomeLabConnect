import request from "supertest";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../../src/domain/settings/systemSettings.js";
import { buildTestApp, signIn } from "../support/testApp.js";

async function setup() {
  const testApp = await buildTestApp();
  const president = await testApp.given.customRole({
    name: "President",
    baseRole: "admin",
    entries: [{ key: "settings.manage", effect: "deny" }],
  });
  await testApp.given.user({
    email: "admin@example.com",
    role: "admin",
    firstName: "System",
    lastName: "Admin",
  });
  await testApp.given.user({
    email: "president@example.com",
    role: "admin",
    customRoleId: president.id,
  });
  await testApp.given.user({ email: "support@example.com", role: "support" });
  await testApp.given.user({ email: "medteam@example.com", role: "med_team" });
  await testApp.given.user({ email: "patient@example.com", role: "patient" });
  const as = (email: string) => signIn(testApp.app, email);
  return {
    ...testApp,
    admin: await as("admin@example.com"),
    president: await as("president@example.com"),
    support: await as("support@example.com"),
    medTeam: await as("medteam@example.com"),
    patient: await as("patient@example.com"),
  };
}

describe("/api/settings", () => {
  it("returns the defaults until an admin saves, then who changed them", async () => {
    const { app, admin } = await setup();

    const before = await request(app).get("/api/settings").set(admin);
    expect(before.body).toEqual({ settings: DEFAULT_SETTINGS, updatedAt: null, updatedBy: null });

    const saved = await request(app)
      .put("/api/settings")
      .set(admin)
      .send({ ...DEFAULT_SETTINGS, visitStart: "07:00", visitEnd: "13:00" });
    expect(saved.status).toBe(200);
    expect(saved.body.settings).toMatchObject({ visitStart: "07:00", visitEnd: "13:00" });
    expect(saved.body.updatedBy).toBe("System Admin");
    expect(saved.body.updatedAt).not.toBeNull();
  });

  it("lets the President view but not change settings, and hides them from support", async () => {
    const { app, president, support } = await setup();

    expect((await request(app).get("/api/settings").set(president)).status).toBe(200);
    expect(
      (await request(app).put("/api/settings").set(president).send(DEFAULT_SETTINGS)).status,
    ).toBe(403);
    expect((await request(app).get("/api/settings").set(support)).status).toBe(403);
  });

  it("puts each problem under its field", async () => {
    const { app, admin } = await setup();

    const res = await request(app)
      .put("/api/settings")
      .set(admin)
      .send({ ...DEFAULT_SETTINGS, visitEnd: "05:00", minNoticeHours: 48, bookingWindowDays: 2 });

    expect(res.status).toBe(400);
    expect(res.body.error.issues.map((issue: { path: string }) => issue.path).sort()).toEqual([
      "minNoticeHours",
      "visitEnd",
    ]);
  });
});

describe("/api/holidays", () => {
  const outing = {
    date: "2026-10-09",
    name: "Company outing",
    kind: "special_day_off",
    repeatsYearly: false,
  };

  it("lets an admin add, rename and remove a closed day", async () => {
    const { app, admin } = await setup();

    const created = await request(app).post("/api/holidays").set(admin).send(outing);
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    const renamed = await request(app)
      .put(`/api/holidays/${id}`)
      .set(admin)
      .send({ ...outing, name: "Team building" });
    expect(renamed.body.name).toBe("Team building");

    expect((await request(app).delete(`/api/holidays/${id}`).set(admin)).status).toBe(204);
    expect((await request(app).get("/api/holidays").set(admin)).body).toEqual([]);
  });

  it("lists one year's one-time days plus every yearly one", async () => {
    const { app, admin, given } = await setup();
    await given.closedDay({ date: "2026-12-25", name: "Christmas Day", repeatsYearly: true });
    await given.closedDay({ date: "2026-10-09", name: "Outing 2026" });
    await given.closedDay({ date: "2027-03-01", name: "Outing 2027" });

    const res = await request(app).get("/api/holidays?year=2027").set(admin);

    expect(res.body.map((day: { name: string }) => day.name)).toEqual([
      "Christmas Day",
      "Outing 2027",
    ]);
  });

  it("refuses a date that's already closed", async () => {
    const { app, admin, given } = await setup();
    await given.closedDay({ date: "2025-12-25", name: "Christmas Day", repeatsYearly: true });

    const res = await request(app)
      .post("/api/holidays")
      .set(admin)
      .send({ ...outing, date: "2026-12-25" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("closed_day_exists");
  });

  it("lets staff see closed days, only admins change them, and hides them from patients", async () => {
    const { app, medTeam, patient } = await setup();

    expect((await request(app).get("/api/holidays").set(medTeam)).status).toBe(200);
    expect((await request(app).post("/api/holidays").set(medTeam).send(outing)).status).toBe(403);
    expect((await request(app).get("/api/holidays").set(patient)).status).toBe(403);
  });
});
