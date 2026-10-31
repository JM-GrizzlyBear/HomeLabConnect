import request from "supertest";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../../src/domain/settings/systemSettings.js";
import { buildTestApp, signIn } from "../support/testApp.js";

// FixedClock: Thursday 2026-01-15, 4:00 PM Philippine time. Default settings: visits
// 06:00–12:00 in 60-minute slots, 24 hours' notice, staff approve each booking.
const VISIT_DATE = "2026-01-17"; // Saturday, inside the 2026-01-05 roster period

/** One med team (Juan, working on the visit date), a patient, admin and support. */
async function setup({ teams = 1 } = {}) {
  const testApp = await buildTestApp();
  const { given, app } = testApp;
  await given.user({
    email: "admin@example.com",
    role: "admin",
    firstName: "System",
    lastName: "Admin",
  });
  await given.user({ email: "support@example.com", role: "support" });
  const patient = await given.user({
    email: "maria@example.com",
    firstName: "Maria",
    lastName: "Santos",
  });
  await given.user({ email: "other@example.com", firstName: "Other", lastName: "Patient" });
  for (let n = 1; n <= teams; n++) {
    const member = await given.user({ email: `tech${n}@example.com`, role: "med_team" });
    const team = await given.team({ name: `Team ${n}` });
    await given.roster({
      teamId: team.id,
      periodStart: "2026-01-05",
      leadUserId: member.id,
      memberIds: [member.id],
    });
    await given.shifts(member.id, [VISIT_DATE]);
  }
  const category = await given.category("Hematology");
  const cbc = await given.procedure({
    code: "CBC",
    name: "Complete Blood Count",
    categoryId: category.id,
  });
  const lipid = await given.procedure({
    code: "LIPID",
    name: "Lipid Profile",
    categoryId: category.id,
    priceCentavos: 50_000,
  });
  await given.promotion({ name: "January Sale", appliesTo: "selected", procedureIds: [cbc.id] });

  return {
    ...testApp,
    patient,
    cbc,
    lipid,
    asPatient: await signIn(app, "maria@example.com"),
    asOther: await signIn(app, "other@example.com"),
    asAdmin: await signIn(app, "admin@example.com"),
    asSupport: await signIn(app, "support@example.com"),
  };
}

const booking = (procedureIds: string[], slot = "08:00") => ({
  procedureIds,
  date: VISIT_DATE,
  slot,
  address: "12 Rizal St, Makati",
  landmark: "Blue gate",
  notes: null,
});

describe("booking a home visit", () => {
  it("shows open days and slots, quotes sale prices and books with the prices copied", async () => {
    const { app, asPatient, cbc, lipid, appointmentEmails } = await setup();

    const days = await request(app)
      .get(`/api/appointments/availability?from=2026-01-16&to=${VISIT_DATE}`)
      .set(asPatient);
    expect(days.body.map((day: { closedReason: string | null }) => day.closedReason)).toEqual([
      "too_soon",
      null,
    ]);
    expect(days.body[1].slots[0]).toEqual({ start: "06:00", left: 1 });

    const quote = await request(app)
      .get(`/api/appointments/quote?procedureIds=${cbc.id},${lipid.id}`)
      .set(asPatient);
    expect(quote.body).toMatchObject({
      subtotalCentavos: 85_000,
      discountCentavos: 7_000, // 20% off CBC
      totalCentavos: 78_000,
    });

    const booked = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id, lipid.id]));
    expect(booked.status).toBe(201);
    expect(booked.body).toMatchObject({
      code: "HLC-000001",
      status: "pending",
      date: VISIT_DATE,
      slot: "08:00",
      totalCentavos: 78_000,
      paymentStatus: "unpaid",
      patient: { name: "Maria Santos" },
    });
    expect(booked.body.lines[0]).toMatchObject({ code: "CBC", promotionName: "January Sale" });
    expect(appointmentEmails.sent).toEqual([
      { notice: "received", code: "HLC-000001", to: "maria@example.com" },
    ]);

    // The one team's 08:00 place is now taken
    const after = await request(app)
      .get(`/api/appointments/availability?from=${VISIT_DATE}&to=${VISIT_DATE}`)
      .set(asPatient);
    expect(after.body[0].slots).toContainEqual({ start: "08:00", left: 0 });
  });

  it("refuses the last place twice: one booking wins, the other gets slot_full", async () => {
    const { app, asPatient, asOther, cbc } = await setup();

    const [first, second] = await Promise.all([
      request(app)
        .post("/api/appointments")
        .set(asPatient)
        .send(booking([cbc.id])),
      request(app)
        .post("/api/appointments")
        .set(asOther)
        .send(booking([cbc.id])),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    const loser = first.status === 409 ? first : second;
    expect(loser.body.error.code).toBe("slot_full");
  });

  it("refuses a day with no team on duty, a closed day and an off-grid time", async () => {
    const { app, asPatient, cbc, given } = await setup();
    await given.closedDay({ date: "2026-01-19", name: "Team outing", kind: "special_day_off" });

    const noTeam = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send({ ...booking([cbc.id]), date: "2026-01-22" });
    expect(noTeam.body.error).toMatchObject({ code: "slot_not_bookable" });

    const closed = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send({ ...booking([cbc.id]), date: "2026-01-19" });
    expect(closed.body.error.message).toBe("We're closed on that day.");

    const offGrid = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id], "08:30"));
    expect(offGrid.status).toBe(400);
  });

  it("confirms at once with automatic approval", async () => {
    const { app, asPatient, asAdmin, cbc } = await setup();
    await request(app)
      .put("/api/settings")
      .set(asAdmin)
      .send({ ...DEFAULT_SETTINGS, bookingApproval: "automatic" });

    const booked = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id]));

    expect(booked.body.status).toBe("confirmed");
  });
});

describe("a patient's own appointments", () => {
  it("lists and opens only their own, and cancels before the cut-off", async () => {
    const { app, asPatient, asOther, cbc } = await setup();
    const { body } = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id]));

    expect((await request(app).get("/api/appointments/mine").set(asPatient)).body).toHaveLength(1);
    expect((await request(app).get("/api/appointments/mine").set(asOther)).body).toHaveLength(0);
    expect((await request(app).get(`/api/appointments/${body.id}`).set(asOther)).status).toBe(404);
    expect(body.cancellableUntil).toBe("2026-01-16T00:00:00.000Z"); // 24 hours before 8:00 AM

    const cancelled = await request(app)
      .patch(`/api/appointments/${body.id}/cancel`)
      .set(asPatient)
      .send({ reason: null });
    expect(cancelled.body.status).toBe("cancelled");
    expect(cancelled.body.events.map((event: { kind: string }) => event.kind)).toEqual([
      "booked",
      "cancelled",
    ]);
  });

  it("can't cancel after the cut-off", async () => {
    const { app, asPatient, cbc, clock } = await setup();
    const { body } = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id]));

    clock.advanceMinutes(17 * 60); // Friday 9:00 AM: less than 24 hours before the visit
    const res = await request(app)
      .patch(`/api/appointments/${body.id}/cancel`)
      .set(asPatient)
      .send({ reason: null });

    expect(res.body.error.code).toBe("cancel_cutoff_passed");
  });
});

describe("staff review", () => {
  it("lists pending bookings first, then accepts and rejects them", async () => {
    const { app, asPatient, asOther, asAdmin, cbc, appointmentEmails } = await setup({ teams: 2 });
    const first = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id]));
    const second = await request(app)
      .post("/api/appointments")
      .set(asOther)
      .send(booking([cbc.id], "06:00"));

    const list = await request(app).get("/api/appointments?status=pending").set(asAdmin);
    expect(list.body.total).toBe(2);
    expect(list.body.items.map((item: { slot: string }) => item.slot)).toEqual(["06:00", "08:00"]);
    const search = await request(app).get("/api/appointments?q=santos").set(asAdmin);
    expect(search.body.items.map((item: { code: string }) => item.code)).toEqual([first.body.code]);

    const accepted = await request(app)
      .post(`/api/appointments/${first.body.id}/accept`)
      .set(asAdmin);
    expect(accepted.body.status).toBe("confirmed");
    expect(accepted.body.events.at(-1)).toMatchObject({
      kind: "confirmed",
      actorName: "System Admin",
    });

    const noReason = await request(app)
      .post(`/api/appointments/${second.body.id}/reject`)
      .set(asAdmin)
      .send({ reason: "" });
    expect(noReason.status).toBe(400);
    const rejected = await request(app)
      .post(`/api/appointments/${second.body.id}/reject`)
      .set(asAdmin)
      .send({ reason: "No team can reach that area yet." });
    expect(rejected.body).toMatchObject({
      status: "rejected",
      decisionNote: "No team can reach that area yet.",
    });
    expect(appointmentEmails.sent.map((email) => email.notice)).toEqual([
      "received",
      "received",
      "confirmed",
      "rejected",
    ]);

    const again = await request(app)
      .post(`/api/appointments/${second.body.id}/accept`)
      .set(asAdmin);
    expect(again.body.error.code).toBe("appointment_status");
  });

  it("proposes a new time that the patient accepts, moving the visit", async () => {
    const { app, asPatient, asSupport, cbc } = await setup();
    const { body } = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id]));

    const proposed = await request(app)
      .post(`/api/appointments/${body.id}/reschedule`)
      .set(asSupport)
      .send({ date: VISIT_DATE, slot: "10:00", reason: "The team runs late that morning." });
    expect(proposed.body).toMatchObject({
      status: "reschedule_proposed",
      proposal: { date: VISIT_DATE, slot: "10:00" },
    });

    const answered = await request(app)
      .post(`/api/appointments/${body.id}/proposal`)
      .set(asPatient)
      .send({ accept: true });
    expect(answered.body).toMatchObject({ status: "confirmed", slot: "10:00", proposal: null });
  });

  it("cancels the appointment when the patient declines the new time", async () => {
    const { app, asPatient, asAdmin, cbc } = await setup();
    const { body } = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id]));
    await request(app)
      .post(`/api/appointments/${body.id}/reschedule`)
      .set(asAdmin)
      .send({ date: VISIT_DATE, slot: "09:00", reason: "Traffic advisory that morning." });

    const declined = await request(app)
      .post(`/api/appointments/${body.id}/proposal`)
      .set(asPatient)
      .send({ accept: false });

    expect(declined.body.status).toBe("cancelled");
  });

  it("keeps patients and support out of what they may not do", async () => {
    const { app, asPatient, asSupport, cbc } = await setup();
    const { body } = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send(booking([cbc.id]));

    expect((await request(app).get("/api/appointments").set(asPatient)).status).toBe(403);
    expect(
      (await request(app).post(`/api/appointments/${body.id}/accept`).set(asPatient)).status,
    ).toBe(403);
    // Support can see, accept and reject bookings, but not book or cancel
    expect((await request(app).get(`/api/appointments/${body.id}`).set(asSupport)).status).toBe(
      200,
    );
    expect(
      (
        await request(app)
          .patch(`/api/appointments/${body.id}/cancel`)
          .set(asSupport)
          .send({ reason: "No" })
      ).status,
    ).toBe(403);
    expect(
      (await request(app).post(`/api/appointments/${body.id}/accept`).set(asSupport)).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post("/api/appointments")
          .set(asSupport)
          .send(booking([cbc.id]))
      ).status,
    ).toBe(403);
  });
});
