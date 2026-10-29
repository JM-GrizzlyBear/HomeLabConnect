import { sql } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

const VISIT_DATE = "2026-01-17";
const DAY = "from=2026-01-15&to=2026-01-15&period=day";

/**
 * With a standing 20% promotion: Maria books CBC + LIPID (₱560 after ₱140 off); the team
 * collects CBC only and takes cash; ₱100 is refunded. Juan books CBC and is rejected.
 * Both bookings were made on Thursday 2026-01-15.
 */
async function setup() {
  const testApp = await buildTestApp();
  const { given, app, db } = testApp;
  await given.user({ email: "admin@example.com", role: "admin" });
  await given.user({ email: "admin2@example.com", role: "admin" });
  await given.user({ email: "maria@example.com" });
  await given.user({ email: "juan@example.com" });
  const tech = await given.user({ email: "tech1@example.com", role: "med_team" });
  const team = await given.team({ name: "Team 1" });
  await given.roster({
    teamId: team.id,
    periodStart: "2026-01-05",
    leadUserId: tech.id,
    memberIds: [tech.id],
  });
  await given.shifts(tech.id, [VISIT_DATE]);
  const category = await given.category("Hematology");
  const cbc = await given.procedure({ code: "CBC", categoryId: category.id });
  const lipid = await given.procedure({ code: "LIPID", categoryId: category.id });
  await given.promotion({ name: "Senior & PWD Discount", endsOn: null });

  const as = {
    admin: await signIn(app, "admin@example.com"),
    admin2: await signIn(app, "admin2@example.com"),
    maria: await signIn(app, "maria@example.com"),
    juan: await signIn(app, "juan@example.com"),
    tech: await signIn(app, "tech1@example.com"),
  };
  const book = async (who: Record<string, string>, procedureIds: string[], slot: string) =>
    (
      await request(app).post("/api/appointments").set(who).send({
        procedureIds,
        date: VISIT_DATE,
        slot,
        address: "12 Rizal St",
        landmark: null,
        notes: null,
      })
    ).body.id as string;

  const maria = await book(as.maria, [cbc.id, lipid.id], "08:00");
  const juan = await book(as.juan, [cbc.id], "09:00");
  await request(app)
    .post(`/api/appointments/${juan}/reject`)
    .set(as.admin)
    .send({ reason: "Address outside our area" });
  await request(app).post(`/api/appointments/${maria}/accept`).set(as.admin);
  await request(app).put(`/api/appointments/${maria}/team`).set(as.admin).send({ teamId: team.id });
  await request(app).post(`/api/visits/${maria}`).set(as.tech).send({ outcome: "on_the_way" });
  await request(app)
    .post(`/api/visits/${maria}`)
    .set(as.tech)
    .send({ outcome: "collected", collectedProcedureIds: [cbc.id], note: null });
  await request(app).post(`/api/appointments/${maria}/cash`).set(as.tech);
  const [payment] = (await request(app).get("/api/payments").set(as.admin)).body.items;
  await request(app)
    .post(`/api/payments/${payment.id}/refunds`)
    .set(as.admin)
    .send({ amountCentavos: 10_000, reason: "Goodwill" });
  // Bookings are dated by the database clock: pin them to the test's Thursday
  await db.execute(sql`update appointments set created_at = '2026-01-15T02:00:00Z'`);

  const report = async (kind: string, query = DAY, who = as.admin) =>
    await request(app).get(`/api/reports/${kind}?${query}`).set(who);
  return { ...testApp, as, report };
}

describe("reports", () => {
  it("adds up revenue per period, with refunds and discounts", async () => {
    const { report } = await setup();
    const res = await report("revenue", "from=2026-01-14&to=2026-01-15&period=day");
    expect(res.status).toBe(200);
    expect(res.body.rows).toEqual([
      { period: "2026-01-14", card: 0, cash: 0, refunded: 0, kept: 0, payments: 0 },
      { period: "2026-01-15", card: 0, cash: 56_000, refunded: 10_000, kept: 46_000, payments: 1 },
    ]);
    expect(res.body.totals).toMatchObject({ cash: 56_000, kept: 46_000 });
    // The rejected booking's discount doesn't count
    expect(res.body.discounts).toEqual([
      { promotion: "Senior & PWD Discount", centavos: 14_000, tests: 2 },
    ]);
  });

  it("counts bookings, what became of them, and why some didn't go ahead", async () => {
    const { report } = await setup();
    const res = await report("bookings");
    expect(res.body.totals).toEqual({
      booked: 2,
      confirmed: 1,
      rejected: 1,
      cancelled: 0,
      collected: 1,
      notCollected: 0,
      returnVisits: 0,
      collectionRate: 100,
    });
    expect(res.body.topReasons).toEqual([{ reason: "Address outside our area", count: 1 }]);
  });

  it("lists each test ordered, collected and earned", async () => {
    const { report } = await setup();
    const res = await report("tests", "from=2026-01-15&to=2026-01-15");
    expect(res.body.rows).toEqual([
      expect.objectContaining({ code: "CBC", ordered: 2, collected: 1, revenueCentavos: 28_000 }),
      expect.objectContaining({ code: "LIPID", ordered: 1, collected: 0, revenueCentavos: 28_000 }),
    ]);
    expect(res.body.categories).toEqual([
      { category: "Hematology", ordered: 3, collected: 1, revenueCentavos: 56_000 },
    ]);
  });

  it("exports a report as CSV", async () => {
    const { app, as } = await setup();
    const res = await request(app).get(`/api/reports/revenue/export?${DAY}`).set(as.admin);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain(
      'filename="revenue-2026-01-15-to-2026-01-15.csv"',
    );
    expect(res.text).toContain("2026-01-15,0.00,560.00,100.00,460.00,1");
    expect(res.text).toContain("Total,0.00,560.00,100.00,460.00,1");
  });

  it("refuses a backwards range", async () => {
    const { report } = await setup();
    const res = await report("revenue", "from=2026-02-01&to=2026-01-01");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_report_range");
  });

  it("keeps each user's saved reports to themselves", async () => {
    const { app, as } = await setup();
    const save = (who: Record<string, string>, name: string) =>
      request(app).post("/api/reports/saved").set(who).send({
        name,
        kind: "revenue",
        period: "month",
        preset: "this_month",
        from: null,
        to: null,
      });

    const saved = await save(as.admin, "Monthly revenue");
    expect(saved.status).toBe(201);
    expect((await save(as.admin, "Monthly revenue")).body.error.code).toBe(
      "saved_report_name_taken",
    );
    await save(as.admin2, "Theirs");

    const mine = await request(app).get("/api/reports/saved").set(as.admin);
    expect(mine.body).toEqual([
      expect.objectContaining({ name: "Monthly revenue", preset: "this_month", from: null }),
    ]);
    const theirs = await request(app).delete(`/api/reports/saved/${saved.body.id}`).set(as.admin2);
    expect(theirs.status).toBe(404);
    const own = await request(app).delete(`/api/reports/saved/${saved.body.id}`).set(as.admin);
    expect(own.status).toBe(204);
  });

  it("is only for reports.view and reports.export", async () => {
    const { app, as, report } = await setup();
    expect((await report("revenue", DAY, as.maria)).status).toBe(403);
    expect(
      (await request(app).get(`/api/reports/revenue/export?${DAY}`).set(as.maria)).status,
    ).toBe(403);
  });
});
