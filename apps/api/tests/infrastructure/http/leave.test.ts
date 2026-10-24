import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../../support/testApp.js";

type TestApp = ReturnType<typeof buildTestApp>;

async function loginAs(app: TestApp["app"], email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password123" });
  return { Authorization: `Bearer ${res.body.token as string}` };
}

// FixedClock: Thursday 2026-01-15; the roster period starts Monday 2026-01-05.
async function setup() {
  const testApp = buildTestApp();
  const { users, teams, shifts } = testApp;
  users.add({ email: "admin@example.com", role: "admin", firstName: "System", lastName: "Admin" });
  const juan = users.add({
    email: "juan@example.com",
    role: "med_team",
    firstName: "Juan",
    lastName: "Dela Cruz",
  });
  const paolo = users.add({
    email: "paolo@example.com",
    role: "med_team",
    firstName: "Paolo",
    lastName: "Garcia",
  });
  users.add({
    email: "doctor@example.com",
    role: "doctor",
    firstName: "Maria",
    lastName: "Santos",
  });
  const makati = teams.add({ name: "Team Makati" });
  teams.rosters.push({
    teamId: makati.id,
    periodStart: "2026-01-05",
    leadUserId: juan.id,
    memberIds: [juan.id, paolo.id],
  });
  // Thu–Sat Jan 15–17, 2026: leave on Fri and Sat should show over these shifts.
  shifts.add(paolo.id, ["2026-01-15", "2026-01-16", "2026-01-17"]);
  const as = (email: string) => loginAs(testApp.app, email);
  return {
    ...testApp,
    juan,
    paolo,
    admin: await as("admin@example.com"),
    lead: await as("juan@example.com"),
    member: await as("paolo@example.com"),
    doctor: await as("doctor@example.com"),
  };
}

const vacation = {
  type: "vacation",
  startsOn: "2026-01-16",
  endsOn: "2026-01-17",
  reason: "Family trip",
};

describe("/api/leave", () => {
  it("goes from the team lead to an admin, then shows as leave on the schedule", async () => {
    const { app, admin, lead, member } = await setup();

    const filed = await request(app).post("/api/leave").set(member).send(vacation);
    expect(filed.status).toBe(201);
    expect(filed.body).toMatchObject({
      requesterName: "Paolo Garcia",
      chain: ["team_lead", "admin"],
      waitingFor: "team_lead",
    });
    const id = filed.body.id as string;

    // The lead (without leave.approve) sees it; the admin doesn't yet.
    expect((await request(app).get("/api/leave/inbox").set(lead)).body).toHaveLength(1);
    expect((await request(app).get("/api/leave/inbox").set(admin)).body).toHaveLength(0);
    expect(
      (
        await request(app)
          .post(`/api/leave/${id}/decision`)
          .set(admin)
          .send({ decision: "approved", note: null })
      ).status,
    ).toBe(403);

    const step1 = await request(app)
      .post(`/api/leave/${id}/decision`)
      .set(lead)
      .send({ decision: "approved", note: "Covered by Juan" });
    expect(step1.body).toMatchObject({ status: "pending", waitingFor: "admin" });

    const step2 = await request(app)
      .post(`/api/leave/${id}/decision`)
      .set(admin)
      .send({ decision: "approved", note: null });
    expect(step2.body.status).toBe("approved");
    expect(
      step2.body.decisions.map((decision: { approverName: string }) => decision.approverName),
    ).toEqual(["Juan Dela Cruz", "System Admin"]);

    const schedule = await request(app)
      .get("/api/shifts/mine?from=2026-01-15&to=2026-01-17")
      .set(member);
    expect(schedule.body.map((day: { status: string }) => day.status)).toEqual([
      "working",
      "leave",
      "leave",
    ]);
  });

  it("sends a doctor straight to an admin, who can reject it", async () => {
    const { app, admin, doctor } = await setup();

    const filed = await request(app).post("/api/leave").set(doctor).send(vacation);
    expect(filed.body.chain).toEqual(["admin"]);

    const rejected = await request(app)
      .post(`/api/leave/${filed.body.id as string}/decision`)
      .set(admin)
      .send({ decision: "rejected", note: "Clinic audit that week" });
    expect(rejected.body).toMatchObject({ status: "rejected", waitingFor: null });

    const mine = await request(app).get("/api/leave/mine").set(doctor);
    expect(mine.body[0].decisions[0].note).toBe("Clinic audit that week");
  });

  it("refuses overlapping leave and lets the requester cancel", async () => {
    const { app, member, lead } = await setup();
    const filed = await request(app).post("/api/leave").set(member).send(vacation);

    const overlap = await request(app)
      .post("/api/leave")
      .set(member)
      .send({ ...vacation, startsOn: "2026-01-17", endsOn: "2026-01-19" });
    expect(overlap.status).toBe(409);
    expect(overlap.body.error.code).toBe("leave_overlap");

    expect(
      (
        await request(app)
          .patch(`/api/leave/${filed.body.id as string}/cancel`)
          .set(lead)
      ).status,
    ).toBe(404);
    const cancelled = await request(app)
      .patch(`/api/leave/${filed.body.id as string}/cancel`)
      .set(member);
    expect(cancelled.body.status).toBe("cancelled");
  });

  it("lists everyone's leave for people with leave.view only", async () => {
    const { app, admin, member } = await setup();
    await request(app).post("/api/leave").set(member).send(vacation);

    expect((await request(app).get("/api/leave?status=pending").set(admin)).body).toHaveLength(1);
    expect((await request(app).get("/api/leave").set(member)).status).toBe(403);
  });
});
