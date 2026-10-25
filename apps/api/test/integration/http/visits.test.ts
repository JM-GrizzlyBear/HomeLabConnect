import request from "supertest";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../../src/domain/settings/systemSettings.js";
import { buildTestApp, signIn } from "../support/testApp.js";

// FixedClock: Thursday 2026-01-15, 4:00 PM Philippine time
const VISIT_DATE = "2026-01-17";

/** Two med teams on duty (Team 1: tech1, Team 2: tech2), a patient and an admin. */
async function setup() {
  const testApp = await buildTestApp();
  const { given, app } = testApp;
  await given.user({ email: "admin@example.com", role: "admin" });
  await given.user({ email: "maria@example.com", firstName: "Maria", lastName: "Santos" });
  await given.user({ email: "other@example.com" });
  const teams = [];
  for (const n of [1, 2]) {
    const member = await given.user({ email: `tech${n}@example.com`, role: "med_team" });
    const team = await given.team({ name: `Team ${n}` });
    await given.roster({
      teamId: team.id,
      periodStart: "2026-01-05",
      leadUserId: member.id,
      memberIds: [member.id],
    });
    await given.shifts(member.id, [VISIT_DATE]);
    teams.push(team);
  }
  const category = await given.category("Hematology");
  const cbc = await given.procedure({ code: "CBC", categoryId: category.id });
  const lipid = await given.procedure({ code: "LIPID", categoryId: category.id });

  const asAdmin = await signIn(app, "admin@example.com");
  const book = async (who: Record<string, string>, slot = "08:00") =>
    (
      await request(app)
        .post("/api/appointments")
        .set(who)
        .send({
          procedureIds: [cbc.id, lipid.id],
          date: VISIT_DATE,
          slot,
          address: "12 Rizal St, Makati",
          landmark: null,
          notes: null,
        })
    ).body as { id: string; status: string; team: { name: string } | null };

  return {
    ...testApp,
    teams,
    cbc,
    lipid,
    book,
    asAdmin,
    asPatient: await signIn(app, "maria@example.com"),
    asOther: await signIn(app, "other@example.com"),
    asTech1: await signIn(app, "tech1@example.com"),
    asTech2: await signIn(app, "tech2@example.com"),
  };
}

describe("team assignment", () => {
  it("lets staff give a confirmed visit to a free team, and refuses a busy one", async () => {
    const { app, asAdmin, asPatient, asOther, book, teams } = await setup();
    const first = await book(asPatient);
    const second = await book(asOther);
    await request(app).post(`/api/appointments/${first.id}/accept`).set(asAdmin);
    await request(app).post(`/api/appointments/${second.id}/accept`).set(asAdmin);

    const choices = await request(app).get(`/api/appointments/${first.id}/teams`).set(asAdmin);
    expect(
      choices.body.map((choice: { name: string; available: boolean }) => [
        choice.name,
        choice.available,
      ]),
    ).toEqual([
      ["Team 1", true],
      ["Team 2", true],
    ]);

    const assigned = await request(app)
      .put(`/api/appointments/${first.id}/team`)
      .set(asAdmin)
      .send({ teamId: teams[0]!.id });
    expect(assigned.body.team).toEqual({ id: teams[0]!.id, name: "Team 1" });
    expect(assigned.body.events.at(-1)).toMatchObject({ kind: "team_assigned", note: "Team 1" });

    // Team 1 already has the 8:00 visit
    const clash = await request(app)
      .put(`/api/appointments/${second.id}/team`)
      .set(asAdmin)
      .send({ teamId: teams[0]!.id });
    expect(clash.status).toBe(409);
    expect(clash.body.error.code).toBe("team_unavailable");
  });

  it("assigns automatically to the team with the fewest visits that day", async () => {
    const { app, asAdmin, asPatient, asOther, book } = await setup();
    await request(app)
      .put("/api/settings")
      .set(asAdmin)
      .send({ ...DEFAULT_SETTINGS, bookingApproval: "automatic", teamAssignment: "auto" });

    const first = await book(asPatient, "07:00");
    const second = await book(asOther, "08:00");

    expect(first).toMatchObject({ status: "confirmed", team: { name: "Team 1" } });
    // Team 1 has one visit already, so Team 2 gets the next
    expect(second.team?.name).toBe("Team 2");
  });

  it("needs appointments.assign", async () => {
    const { app, asPatient, book, teams } = await setup();
    const visit = await book(asPatient);
    const res = await request(app)
      .put(`/api/appointments/${visit.id}/team`)
      .set(asPatient)
      .send({ teamId: teams[0]!.id });
    expect(res.status).toBe(403);
  });
});

describe("my visits", () => {
  it("shows a team its visits and records them: on the way, then collected", async () => {
    const { app, asAdmin, asPatient, asTech1, asTech2, book, teams, cbc } = await setup();
    const visit = await book(asPatient);
    await request(app).post(`/api/appointments/${visit.id}/accept`).set(asAdmin);
    await request(app)
      .put(`/api/appointments/${visit.id}/team`)
      .set(asAdmin)
      .send({ teamId: teams[0]!.id });

    const mine = await request(app).get(`/api/visits/mine?date=${VISIT_DATE}`).set(asTech1);
    expect(mine.body.map((item: { id: string }) => item.id)).toEqual([visit.id]);
    expect(
      (await request(app).get(`/api/visits/mine?date=${VISIT_DATE}`).set(asTech2)).body,
    ).toEqual([]);

    // Collecting before setting off isn't allowed
    const tooEarly = await request(app)
      .post(`/api/visits/${visit.id}`)
      .set(asTech1)
      .send({ outcome: "collected", collectedProcedureIds: [cbc.id], note: null });
    expect(tooEarly.body.error.code).toBe("appointment_status");

    const started = await request(app)
      .post(`/api/visits/${visit.id}`)
      .set(asTech1)
      .send({ outcome: "on_the_way" });
    expect(started.body.status).toBe("on_the_way");

    // Another team's member can't record it
    const stranger = await request(app)
      .post(`/api/visits/${visit.id}`)
      .set(asTech2)
      .send({ outcome: "on_the_way" });
    expect(stranger.status).toBe(404);

    const collected = await request(app)
      .post(`/api/visits/${visit.id}`)
      .set(asTech1)
      .send({
        outcome: "collected",
        collectedProcedureIds: [cbc.id],
        note: "Lipid needs fasting; rebook.",
      });
    expect(collected.body).toMatchObject({
      status: "collected",
      collectionNote: "Lipid needs fasting; rebook.",
    });
    expect(
      collected.body.lines.map((line: { code: string; collected: boolean }) => [
        line.code,
        line.collected,
      ]),
    ).toEqual([
      ["CBC", true],
      ["LIPID", false],
    ]);
  });

  it("records a visit that couldn't be collected, with the reason", async () => {
    const { app, asAdmin, asPatient, asTech1, book, teams } = await setup();
    const visit = await book(asPatient);
    await request(app).post(`/api/appointments/${visit.id}/accept`).set(asAdmin);
    await request(app)
      .put(`/api/appointments/${visit.id}/team`)
      .set(asAdmin)
      .send({ teamId: teams[0]!.id });
    await request(app).post(`/api/visits/${visit.id}`).set(asTech1).send({ outcome: "on_the_way" });

    const res = await request(app)
      .post(`/api/visits/${visit.id}`)
      .set(asTech1)
      .send({ outcome: "not_collected", reason: "Nobody was home." });

    expect(res.body).toMatchObject({ status: "not_collected", collectionNote: "Nobody was home." });
    const seen = await request(app).get(`/api/appointments/${visit.id}`).set(asPatient);
    expect(seen.body.events.map((event: { kind: string }) => event.kind)).toContain(
      "not_collected",
    );
  });
});
