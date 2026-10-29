import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

const VISIT_DATE = "2026-01-17";

type Dashboard = {
  stats: { title: string; items: { label: string; value: string }[] };
  donut: { segments: { label: string; value: number }[] };
  bars: { ring: { percent: number; label: string } };
};
const stat = (dashboard: Dashboard, label: string) =>
  dashboard.stats.items.find((item) => item.label === label)?.value;

/**
 * Maria books CBC + LIPID (₱700) for Saturday. It's confirmed and given to Team 1; on the day
 * the team collects CBC only and takes cash, and the doctor releases the result.
 */
async function setup() {
  const testApp = await buildTestApp();
  const { given, app, clock } = testApp;
  await given.user({ email: "admin@example.com", role: "admin" });
  await given.user({ email: "doctor@example.com", role: "doctor" });
  await given.user({ email: "support@example.com", role: "support" });
  await given.user({ email: "maria@example.com", firstName: "Maria", lastName: "Santos" });
  await given.user({ email: "other@example.com" });
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

  const as = {
    admin: await signIn(app, "admin@example.com"),
    doctor: await signIn(app, "doctor@example.com"),
    support: await signIn(app, "support@example.com"),
    patient: await signIn(app, "maria@example.com"),
    other: await signIn(app, "other@example.com"),
    tech: await signIn(app, "tech1@example.com"),
  };
  const booked = await request(app)
    .post("/api/appointments")
    .set(as.patient)
    .send({
      procedureIds: [cbc.id, lipid.id],
      date: VISIT_DATE,
      slot: "08:00",
      address: "12 Rizal St, Makati",
      landmark: null,
      notes: null,
    });
  const visitId = booked.body.id as string;
  await request(app).post(`/api/appointments/${visitId}/accept`).set(as.admin);
  await request(app)
    .put(`/api/appointments/${visitId}/team`)
    .set(as.admin)
    .send({ teamId: team.id });

  const dashboard = async (who: Record<string, string>) =>
    (await request(app).get("/api/dashboard").set(who)).body as Dashboard;

  /** The visit day: collected (CBC only), paid in cash, result released. */
  const visitDay = async () => {
    clock.current = new Date("2026-01-17T01:00:00Z"); // 9:00 AM Philippine time
    await request(app).post(`/api/visits/${visitId}`).set(as.tech).send({ outcome: "on_the_way" });
    await request(app)
      .post(`/api/visits/${visitId}`)
      .set(as.tech)
      .send({ outcome: "collected", collectedProcedureIds: [cbc.id], note: null });
    await request(app).post(`/api/appointments/${visitId}/cash`).set(as.tech);
    await request(app)
      .post(`/api/appointments/${visitId}/results/${cbc.id}`)
      .set(as.doctor)
      .attach("file", Buffer.from("%PDF-1.4\n"), "cbc.pdf");
    await request(app).post(`/api/appointments/${visitId}/results/release`).set(as.doctor);
  };

  return { ...testApp, as, dashboard, visitDay };
}

describe("dashboards", () => {
  it("shows the patient what's coming and what they owe", async () => {
    const { as, dashboard } = await setup();
    const mine = await dashboard(as.patient);
    expect(mine.stats.title).toBe("Your summary");
    expect(stat(mine, "Upcoming visits")).toBe("1");
    expect(stat(mine, "Balance due")).toBe("₱700");
    // Someone else's visits never show
    expect(stat(await dashboard(as.other), "Upcoming visits")).toBe("0");
  });

  it("counts the visit day for each role", async () => {
    const { as, dashboard, visitDay } = await setup();
    await visitDay();

    const admin = await dashboard(as.admin);
    expect(stat(admin, "Home visits")).toBe("1");
    expect(stat(admin, "Results released")).toBe("1");
    expect(stat(admin, "Payments")).toBe("₱700");
    expect(admin.donut.segments).toContainEqual({ label: "Collected", value: 1 });

    const medTeam = await dashboard(as.tech);
    expect(medTeam.stats.title).toBe("Today's route");
    expect(stat(medTeam, "Visits today")).toBe("1");
    expect(stat(medTeam, "Samples collected")).toBe("1");
    expect(stat(medTeam, "Cash collected")).toBe("₱700");
    expect(medTeam.bars.ring).toEqual({ percent: 100, label: "Route done" });

    const doctor = await dashboard(as.doctor);
    expect(stat(doctor, "Released today")).toBe("1");
    expect(stat(doctor, "Ready to release")).toBe("0");

    const support = await dashboard(as.support);
    expect(stat(support, "Pending bookings")).toBe("0");
    expect(stat(support, "Collected, unpaid")).toBe("0");

    const patient = await dashboard(as.patient);
    expect(stat(patient, "Results ready")).toBe("1");
    expect(stat(patient, "Balance due")).toBe("₱0");
    expect(patient.bars.ring).toEqual({ percent: 100, label: "Paid" });
  });

  it("needs dashboard.view", async () => {
    const { app } = await setup();
    expect((await request(app).get("/api/dashboard")).status).toBe(401);
  });
});
