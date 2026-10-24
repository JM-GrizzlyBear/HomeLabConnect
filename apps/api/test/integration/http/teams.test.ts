import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

// FixedClock is 2026-01-15, so "now" is in the period starting Monday 2026-01-05.
const THIS_PERIOD = "2026-01-05";
const NEXT_PERIOD = "2026-01-19";

async function setup() {
  const testApp = await buildTestApp();
  const { given } = testApp;
  const seniorMedTech = await given.customRole({
    name: "Senior Med Tech",
    baseRole: "med_team",
    entries: [{ key: "teams.roster", effect: "grant" }],
  });
  await given.user({ email: "admin@example.com", role: "admin" });
  const juan = await given.user({
    email: "juan@example.com",
    role: "med_team",
    firstName: "Juan",
    lastName: "Dela Cruz",
  });
  const paolo = await given.user({
    email: "paolo@example.com",
    role: "med_team",
    firstName: "Paolo",
    lastName: "Garcia",
    customRoleId: seniorMedTech.id,
  });
  const mia = await given.user({
    email: "mia@example.com",
    role: "med_team",
    firstName: "Mia",
    lastName: "Lopez",
  });
  await given.user({ email: "patient@example.com", role: "patient" });
  const makati = await given.team({ name: "Team Makati", area: "Makati" });
  const qc = await given.team({ name: "Team Quezon City" });
  const as = (email: string) => signIn(testApp.app, email);
  return {
    ...testApp,
    juan,
    paolo,
    mia,
    makati,
    qc,
    admin: await as("admin@example.com"),
    lead: await as("paolo@example.com"),
    medTeam: await as("juan@example.com"),
    patient: await as("patient@example.com"),
  };
}

describe("/api/teams", () => {
  it("lets a Senior Med Tech set a roster that med team can see", async () => {
    const { app, lead, medTeam, makati, juan, paolo, mia } = await setup();

    const saved = await request(app)
      .put(`/api/teams/${makati.id}/rosters/${THIS_PERIOD}`)
      .set(lead)
      .send({ leadUserId: juan.id, memberIds: [juan.id, paolo.id] });
    expect(saved.status).toBe(204);

    const board = await request(app).get("/api/teams").set(medTeam);
    expect(board.body).toMatchObject({ periodStart: THIS_PERIOD, periodEnd: "2026-01-18" });
    const team = board.body.teams.find((candidate: { id: string }) => candidate.id === makati.id);
    expect(team.lead).toEqual({ id: juan.id, name: "Juan Dela Cruz" });
    expect(team.members.map((member: { name: string }) => member.name)).toEqual([
      "Juan Dela Cruz",
      "Paolo Garcia",
    ]);
    expect(board.body.unassigned).toEqual([{ id: mia.id, name: "Mia Lopez" }]);

    expect(
      (
        await request(app)
          .put(`/api/teams/${makati.id}/rosters/${THIS_PERIOD}`)
          .set(medTeam)
          .send({ leadUserId: juan.id, memberIds: [juan.id] })
      ).status,
    ).toBe(403);
  });

  it("refuses putting someone on two teams in one period", async () => {
    const { app, lead, makati, qc, juan, paolo } = await setup();
    await request(app)
      .put(`/api/teams/${makati.id}/rosters/${THIS_PERIOD}`)
      .set(lead)
      .send({ leadUserId: juan.id, memberIds: [juan.id, paolo.id] });

    const res = await request(app)
      .put(`/api/teams/${qc.id}/rosters/${THIS_PERIOD}`)
      .set(lead)
      .send({ leadUserId: paolo.id, memberIds: [paolo.id] });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: "roster_clash",
      message: "Paolo Garcia is already on Team Makati for these two weeks.",
    });
  });

  it("copies the previous period's rosters into an empty one", async () => {
    const { app, lead, makati, juan, paolo } = await setup();
    await request(app)
      .put(`/api/teams/${makati.id}/rosters/${THIS_PERIOD}`)
      .set(lead)
      .send({ leadUserId: juan.id, memberIds: [juan.id, paolo.id] });

    const copied = await request(app).post(`/api/rosters/${NEXT_PERIOD}/copy-previous`).set(lead);
    expect(copied.body).toEqual({ copied: 1 });

    const next = await request(app).get(`/api/teams?date=2026-01-25`).set(lead);
    expect(next.body.periodStart).toBe(NEXT_PERIOD);
    expect(next.body.teams.find((team: { id: string }) => team.id === makati.id).lead.id).toBe(
      juan.id,
    );

    const again = await request(app).post(`/api/rosters/${NEXT_PERIOD}/copy-previous`).set(lead);
    expect(again.status).toBe(409);
  });

  it("lets admins create, rename and deactivate teams, hiding inactive ones from others", async () => {
    const { app, admin, medTeam, lead } = await setup();

    const created = await request(app)
      .post("/api/teams")
      .set(admin)
      .send({ name: "Team Pasig", area: null });
    expect(created.status).toBe(201);
    const id = created.body.id as string;

    const renamed = await request(app)
      .put(`/api/teams/${id}`)
      .set(admin)
      .send({ name: "Team Pasig East", area: "Pasig" });
    expect(renamed.body).toMatchObject({ name: "Team Pasig East", area: "Pasig" });

    await request(app).patch(`/api/teams/${id}/status`).set(admin).send({ isActive: false });
    const names = async (auth: Record<string, string>) =>
      (await request(app).get("/api/teams").set(auth)).body.teams.map(
        (team: { name: string }) => team.name,
      );
    expect(await names(admin)).toContain("Team Pasig East");
    expect(await names(medTeam)).not.toContain("Team Pasig East");

    expect(
      (await request(app).post("/api/teams").set(lead).send({ name: "X", area: null })).status,
    ).toBe(403);
  });

  it("lists med team staff for the roster picker, and hides teams from patients", async () => {
    const { app, lead, patient } = await setup();

    const staff = await request(app).get("/api/staff?role=med_team").set(lead);
    expect(staff.body.map((person: { lastName: string }) => person.lastName)).toEqual([
      "Dela Cruz",
      "Garcia",
      "Lopez",
    ]);
    expect((await request(app).get("/api/teams").set(patient)).status).toBe(403);
  });
});
