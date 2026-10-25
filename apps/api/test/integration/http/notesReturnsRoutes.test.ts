import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

// FixedClock: Thursday 2026-01-15, 4:00 PM Philippine time
const VISIT_DATE = "2026-01-17"; // Saturday
const RETURN_DATE = "2026-01-18"; // Sunday, last day of the 2026-01-05 roster period
const PDF = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\n");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

/** Two teams on duty both days; Maria's visit is confirmed and given to Team 1. */
async function setup() {
  const testApp = await buildTestApp();
  const { given, app } = testApp;
  await given.user({
    email: "admin@example.com",
    role: "admin",
    firstName: "Ana",
    lastName: "Admin",
  });
  await given.user({ email: "maria@example.com", firstName: "Maria", lastName: "Santos" });
  const teams: { id: string }[] = [];
  for (const n of [1, 2]) {
    const member = await given.user({
      email: `tech${n}@example.com`,
      role: "med_team",
      firstName: "Tech",
      lastName: `Number${n}`,
    });
    const team = await given.team({ name: `Team ${n}` });
    await given.roster({
      teamId: team.id,
      periodStart: "2026-01-05",
      leadUserId: member.id,
      memberIds: [member.id],
    });
    await given.shifts(member.id, [VISIT_DATE, RETURN_DATE]);
    teams.push(team);
  }
  const category = await given.category("Hematology");
  const cbc = await given.procedure({ code: "CBC", categoryId: category.id });
  const lipid = await given.procedure({ code: "LIPID", categoryId: category.id });

  const asAdmin = await signIn(app, "admin@example.com");
  const asPatient = await signIn(app, "maria@example.com");
  const book = async (slot: string) => {
    const booked = await request(app)
      .post("/api/appointments")
      .set(asPatient)
      .send({
        procedureIds: [cbc.id, lipid.id],
        date: VISIT_DATE,
        slot,
        address: "12 Rizal St, Makati",
        landmark: null,
        notes: null,
      });
    await request(app).post(`/api/appointments/${booked.body.id}/accept`).set(asAdmin);
    await request(app)
      .put(`/api/appointments/${booked.body.id}/team`)
      .set(asAdmin)
      .send({ teamId: teams[0]!.id });
    return booked.body.id as string;
  };
  const visitId = await book("08:00");

  return {
    ...testApp,
    teams,
    cbc,
    lipid,
    book,
    visitId,
    asAdmin,
    asPatient,
    asTech1: await signIn(app, "tech1@example.com"),
    asTech2: await signIn(app, "tech2@example.com"),
  };
}

describe("notes and attachments", () => {
  it("lets the visit's team add notes and files; the patient sees only shared ones", async () => {
    const { app, visitId, asTech1, asTech2, asPatient, files } = await setup();

    // The assigned team can open the visit; another team can't
    expect((await request(app).get(`/api/appointments/${visitId}`).set(asTech1)).status).toBe(200);
    expect((await request(app).get(`/api/appointments/${visitId}`).set(asTech2)).status).toBe(404);

    const internal = await request(app)
      .post(`/api/appointments/${visitId}/notes`)
      .set(asTech1)
      .field("body", "Dog at the gate; call first.");
    expect(internal.status).toBe(201);

    const shared = await request(app)
      .post(`/api/appointments/${visitId}/notes`)
      .set(asTech1)
      .field("body", "Request form attached.")
      .field("sharedWithPatient", "true")
      .attach("file", PDF, { filename: "request.pdf", contentType: "application/pdf" });
    expect(shared.status).toBe(201);
    expect(shared.body[0]).toMatchObject({
      body: "Request form attached.",
      sharedWithPatient: true,
      author: { name: "Tech Number1" },
      attachments: [{ filename: "request.pdf", mimeType: "application/pdf" }],
    });
    expect([...files.saved.values()].map((file) => file.mimeType)).toEqual(["application/pdf"]);

    const staffView = await request(app).get(`/api/appointments/${visitId}/notes`).set(asTech1);
    expect(staffView.body).toHaveLength(2);
    const patientView = await request(app).get(`/api/appointments/${visitId}/notes`).set(asPatient);
    expect(patientView.body.map((note: { body: string }) => note.body)).toEqual([
      "Request form attached.",
    ]);
    // Patients can't add notes
    expect(
      (
        await request(app)
          .post(`/api/appointments/${visitId}/notes`)
          .set(asPatient)
          .field("body", "Hi")
      ).status,
    ).toBe(403);
  });

  it("refuses a renamed text file, an empty note and a file over 5 MB", async () => {
    const { app, visitId, asTech1 } = await setup();

    const fake = await request(app)
      .post(`/api/appointments/${visitId}/notes`)
      .set(asTech1)
      .attach("file", Buffer.from("not a pdf"), {
        filename: "x.pdf",
        contentType: "application/pdf",
      });
    expect(fake.body.error.code).toBe("invalid_note");

    const empty = await request(app)
      .post(`/api/appointments/${visitId}/notes`)
      .set(asTech1)
      .field("body", "  ");
    expect(empty.body.error.message).toBe("Write a note or attach a file.");

    const huge = await request(app)
      .post(`/api/appointments/${visitId}/notes`)
      .set(asTech1)
      .attach("file", Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]), {
        filename: "big.png",
        contentType: "image/png",
      });
    expect(huge.body.error.issues[0].message).toBe("The file must be 5 MB or smaller.");
  });

  it("lets the uploader or an admin remove a file", async () => {
    const { app, visitId, asTech1, asAdmin, files } = await setup();
    const added = await request(app)
      .post(`/api/appointments/${visitId}/notes`)
      .set(asTech1)
      .attach("file", PNG, { filename: "gate.png", contentType: "image/png" });
    const attachmentId = added.body[0].attachments[0].id as string;

    const removed = await request(app)
      .delete(`/api/appointments/${visitId}/attachments/${attachmentId}`)
      .set(asAdmin);
    expect(removed.status).toBe(204);
    expect(files.deleted).toEqual(["file-1"]);
  });
});

describe("return visits", () => {
  it("books the missed tests at ₱0, with the same team, linked both ways", async () => {
    const { app, visitId, asTech1, asPatient, cbc, teams, appointmentEmails } = await setup();
    await request(app).post(`/api/visits/${visitId}`).set(asTech1).send({ outcome: "on_the_way" });
    await request(app)
      .post(`/api/visits/${visitId}`)
      .set(asTech1)
      .send({
        outcome: "collected",
        collectedProcedureIds: [cbc.id],
        note: "Lipid needs fasting.",
      });

    const returned = await request(app)
      .post(`/api/appointments/${visitId}/return`)
      .set(asTech1)
      .send({ date: RETURN_DATE, slot: "07:00" });

    expect(returned.status).toBe(201);
    expect(returned.body).toMatchObject({
      status: "confirmed",
      date: RETURN_DATE,
      totalCentavos: 0,
      team: { id: teams[0]!.id },
      returnOf: { id: visitId },
    });
    expect(returned.body.lines.map((line: { code: string }) => line.code)).toEqual(["LIPID"]);
    expect(appointmentEmails.sent.at(-1)?.notice).toBe("confirmed");

    const original = await request(app).get(`/api/appointments/${visitId}`).set(asPatient);
    expect(original.body.returnVisits).toEqual([
      { id: returned.body.id, code: returned.body.code },
    ]);
  });

  it("refuses a visit that was fully collected, or one not yet done", async () => {
    const { app, visitId, asTech1, cbc, lipid } = await setup();
    const early = await request(app)
      .post(`/api/appointments/${visitId}/return`)
      .set(asTech1)
      .send({ date: RETURN_DATE, slot: "07:00" });
    expect(early.body.error.code).toBe("appointment_status");

    await request(app).post(`/api/visits/${visitId}`).set(asTech1).send({ outcome: "on_the_way" });
    await request(app)
      .post(`/api/visits/${visitId}`)
      .set(asTech1)
      .send({ outcome: "collected", collectedProcedureIds: [cbc.id, lipid.id], note: null });
    const done = await request(app)
      .post(`/api/appointments/${visitId}/return`)
      .set(asTech1)
      .send({ date: RETURN_DATE, slot: "07:00" });
    expect(done.body.error.message).toBe("Every test on this visit was collected.");
  });
});

describe("daily route", () => {
  it("orders by time, lets an admin reorder, and My Visits follows", async () => {
    const { app, book, visitId, teams, asAdmin, asTech1 } = await setup();
    const early = await book("06:00");

    const route = await request(app)
      .get(`/api/routes?teamId=${teams[0]!.id}&date=${VISIT_DATE}`)
      .set(asTech1);
    expect(route.body.map((stop: { id: string }) => stop.id)).toEqual([early, visitId]);

    const reordered = await request(app)
      .put("/api/routes")
      .set(asAdmin)
      .send({ teamId: teams[0]!.id, date: VISIT_DATE, appointmentIds: [visitId, early] });
    expect(reordered.body.map((stop: { id: string }) => stop.id)).toEqual([visitId, early]);

    const mine = await request(app).get(`/api/visits/mine?date=${VISIT_DATE}`).set(asTech1);
    expect(mine.body.map((stop: { id: string }) => stop.id)).toEqual([visitId, early]);
  });

  it("keeps the med team to its own route, read-only", async () => {
    const { app, teams, visitId, asTech1, asTech2 } = await setup();

    const teamsForTech = await request(app)
      .get(`/api/routes/teams?date=${VISIT_DATE}`)
      .set(asTech1);
    expect(teamsForTech.body.map((team: { name: string }) => team.name)).toEqual(["Team 1"]);
    expect(
      (await request(app).get(`/api/routes?teamId=${teams[0]!.id}&date=${VISIT_DATE}`).set(asTech2))
        .status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .put("/api/routes")
          .set(asTech1)
          .send({ teamId: teams[0]!.id, date: VISIT_DATE, appointmentIds: [visitId] })
      ).status,
    ).toBe(403);
  });

  it("refuses an order that doesn't list exactly the day's visits", async () => {
    const { app, teams, visitId, asAdmin } = await setup();
    const res = await request(app)
      .put("/api/routes")
      .set(asAdmin)
      .send({ teamId: teams[0]!.id, date: VISIT_DATE, appointmentIds: [visitId, visitId] });
    expect(res.body.error.code).toBe("invalid_visit_record");
  });
});
