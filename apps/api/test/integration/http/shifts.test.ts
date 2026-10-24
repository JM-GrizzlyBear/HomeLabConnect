import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

async function setup() {
  const testApp = await buildTestApp();
  await testApp.given.user({ email: "admin@example.com", role: "admin" });
  const juan = await testApp.given.user({
    email: "juan@example.com",
    role: "med_team",
    firstName: "Juan",
    lastName: "Dela Cruz",
  });
  await testApp.given.user({ email: "patient@example.com", role: "patient" });
  return {
    ...testApp,
    juan,
    admin: await signIn(testApp.app, "admin@example.com"),
    medTeam: await signIn(testApp.app, "juan@example.com"),
    patient: await signIn(testApp.app, "patient@example.com"),
  };
}

// Mon Oct 5 to Sun Oct 11, 2026.
const week = [
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",
  "2026-10-10",
  "2026-10-11",
];
const statuses = (days: { status: string }[]) => days.map((day) => day.status);

describe("/api/shifts", () => {
  it("gives picked days the same hours, which the person then sees", async () => {
    const { app, admin, medTeam, juan, given } = await setup();
    await given.closedDay({ date: "2025-10-09", name: "Company outing", repeatsYearly: true });

    const set = await request(app)
      .put(`/api/shifts/${juan.id}/days`)
      .set(admin)
      .send({ dates: week.slice(0, 4), hours: { start: "08:00", end: "17:00" } });
    expect(set.body).toEqual({ changed: 4 });

    const mine = await request(app)
      .get(`/api/shifts/mine?from=${week[0]}&to=${week[6]}`)
      .set(medTeam);
    expect(statuses(mine.body)).toEqual([
      "working",
      "working",
      "working",
      "working",
      "closed",
      "off",
      "off",
    ]);
    expect(mine.body[0]).toMatchObject({ start: "08:00", end: "17:00" });
  });

  it("takes picked days off, and changes the hours of others", async () => {
    const { app, admin, medTeam, juan, given } = await setup();
    await given.shifts(juan.id, week.slice(0, 6), "06:00", "14:00");

    await request(app)
      .put(`/api/shifts/${juan.id}/days`)
      .set(admin)
      .send({ dates: [week[1], week[2]], hours: null });
    await request(app)
      .put(`/api/shifts/${juan.id}/days`)
      .set(admin)
      .send({ dates: [week[5]], hours: { start: "08:00", end: "12:00" } });

    const mine = await request(app)
      .get(`/api/shifts/mine?from=${week[0]}&to=${week[6]}`)
      .set(medTeam);
    expect(statuses(mine.body)).toEqual([
      "working",
      "off",
      "off",
      "working",
      "working",
      "working",
      "off",
    ]);
    expect(mine.body[5]).toMatchObject({ start: "08:00", end: "12:00" });
  });

  it("shows everyone's days on the board, by role", async () => {
    const { app, admin, juan, given } = await setup();
    await given.shifts(juan.id, [week[0]!]);

    const board = await request(app)
      .get(`/api/shifts?from=${week[0]}&to=${week[6]}&role=med_team`)
      .set(admin);
    expect(board.body).toHaveLength(1);
    expect(board.body[0].person).toMatchObject({ id: juan.id, firstName: "Juan" });
    expect(statuses(board.body[0].days)).toEqual([
      "working",
      "off",
      "off",
      "off",
      "off",
      "off",
      "off",
    ]);
  });

  it("puts bad hours under their field, and refuses an empty pick", async () => {
    const { app, admin, juan } = await setup();

    const bad = await request(app)
      .put(`/api/shifts/${juan.id}/days`)
      .set(admin)
      .send({ dates: [week[0]], hours: { start: "17:00", end: "08:00" } });
    expect(bad.status).toBe(400);
    expect(bad.body.error.issues[0].path).toBe("hours.end");

    const empty = await request(app)
      .put(`/api/shifts/${juan.id}/days`)
      .set(admin)
      .send({ dates: [], hours: null });
    expect(empty.status).toBe(400);
  });

  it("keeps the board and changes to people who may see or manage shifts", async () => {
    const { app, medTeam, patient, juan } = await setup();

    expect(
      (await request(app).get(`/api/shifts?from=${week[0]}&to=${week[6]}`).set(medTeam)).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .put(`/api/shifts/${juan.id}/days`)
          .set(medTeam)
          .send({ dates: [week[0]], hours: null })
      ).status,
    ).toBe(403);
    expect(
      (await request(app).get(`/api/shifts/mine?from=${week[0]}&to=${week[6]}`).set(patient))
        .status,
    ).toBe(403);
  });

  it("refuses a range over 62 days", async () => {
    const { app, medTeam } = await setup();

    const res = await request(app)
      .get("/api/shifts/mine?from=2026-01-01&to=2026-12-31")
      .set(medTeam);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_date_range");
  });
});
