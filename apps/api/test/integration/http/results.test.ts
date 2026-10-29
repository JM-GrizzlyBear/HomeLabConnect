import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

// FixedClock: Thursday 2026-01-15, 4:00 PM Philippine time
const VISIT_DATE = "2026-01-17";
const PDF = Buffer.from("%PDF-1.4\n% a lab result\n");

/** A visit with CBC and LIPID; the team collects CBC only. A doctor, the patient and others. */
async function setup() {
  const testApp = await buildTestApp();
  const { given, app } = testApp;
  await given.user({ email: "admin@example.com", role: "admin" });
  await given.user({ email: "doctor@example.com", role: "doctor" });
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

  const asAdmin = await signIn(app, "admin@example.com");
  const asDoctor = await signIn(app, "doctor@example.com");
  const asPatient = await signIn(app, "maria@example.com");
  const asTech = await signIn(app, "tech1@example.com");

  const booked = await request(app)
    .post("/api/appointments")
    .set(asPatient)
    .send({
      procedureIds: [cbc.id, lipid.id],
      date: VISIT_DATE,
      slot: "08:00",
      address: "12 Rizal St, Makati",
      landmark: null,
      notes: null,
    });
  const visitId = booked.body.id as string;

  const collect = async () => {
    await request(app).post(`/api/appointments/${visitId}/accept`).set(asAdmin);
    await request(app)
      .put(`/api/appointments/${visitId}/team`)
      .set(asAdmin)
      .send({ teamId: team.id });
    await request(app).post(`/api/visits/${visitId}`).set(asTech).send({ outcome: "on_the_way" });
    await request(app)
      .post(`/api/visits/${visitId}`)
      .set(asTech)
      .send({ outcome: "collected", collectedProcedureIds: [cbc.id], note: null });
  };
  const upload = (procedureId: string, who = asDoctor, file = PDF) =>
    request(app)
      .post(`/api/appointments/${visitId}/results/${procedureId}`)
      .set(who)
      .field("comment", "Within normal range.")
      .attach("file", file, "cbc.pdf");
  const results = (who: Record<string, string>) =>
    request(app).get(`/api/appointments/${visitId}/results`).set(who);

  return {
    ...testApp,
    visitId,
    cbc,
    lipid,
    asAdmin,
    asDoctor,
    asPatient,
    asTech,
    asOther: await signIn(app, "other@example.com"),
    collect,
    upload,
    results,
  };
}

describe("uploading results", () => {
  it("takes results only for collected tests of a collected visit", async () => {
    const { cbc, lipid, collect, upload } = await setup();
    const early = await upload(cbc.id);
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe("result_not_allowed");

    await collect();
    expect((await upload(lipid.id)).status).toBe(409);
    expect((await upload(cbc.id)).status).toBe(204);
  });

  it("refuses files that aren't a PDF or photo", async () => {
    const { cbc, collect, upload } = await setup();
    await collect();
    const res = await upload(cbc.id, undefined, Buffer.from("just text"));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_result");
  });

  it("replaces a draft and removes the old file", async () => {
    const { cbc, collect, upload, privateFiles, results, asDoctor } = await setup();
    await collect();
    await upload(cbc.id);
    await upload(cbc.id);

    expect(privateFiles.deleted).toEqual(["private-1"]);
    const res = await results(asDoctor);
    expect(res.body).toMatchObject({
      state: "pending",
      canManage: true,
      tests: [{ code: "CBC", result: { filename: "cbc.pdf", comment: "Within normal range." } }],
    });
  });

  it("needs results.upload", async () => {
    const { cbc, collect, upload, asTech } = await setup();
    await collect();
    expect((await upload(cbc.id, asTech)).status).toBe(403);
  });
});

describe("releasing results", () => {
  it("keeps them from the patient until released, then until paid", async () => {
    const { app, visitId, cbc, collect, upload, results, asDoctor, asPatient, asTech } =
      await setup();
    await collect();
    await upload(cbc.id);

    const pending = await results(asPatient);
    expect(pending.body).toMatchObject({ state: "pending", canManage: false });
    expect(pending.body.tests[0].result).toBeNull();

    expect(
      (await request(app).post(`/api/appointments/${visitId}/results/release`).set(asDoctor))
        .status,
    ).toBe(204);

    const locked = await results(asPatient);
    expect(locked.body.state).toBe("locked");
    expect(locked.body.tests[0].result).toBeNull();
    const doctorView = await results(asDoctor);
    const fileUrl = doctorView.body.tests[0].result.fileUrl as string;
    expect((await request(app).get(fileUrl).set(asPatient)).status).toBe(404);

    await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech);
    const ready = await results(asPatient);
    expect(ready.body.state).toBe("ready");
    const file = await request(app).get(fileUrl).set(asPatient);
    expect(file.status).toBe(200);
    expect(file.headers["content-type"]).toBe("application/pdf");
    expect(file.headers["cache-control"]).toContain("no-store");
    expect(Buffer.from(file.body as Buffer).toString()).toBe(PDF.toString());
  });

  it("needs every collected test, happens once, and tells the patient", async () => {
    const { app, visitId, cbc, collect, upload, asDoctor, appointmentEmails } = await setup();
    await collect();
    const release = () =>
      request(app).post(`/api/appointments/${visitId}/results/release`).set(asDoctor);

    const missing = await release();
    expect(missing.status).toBe(409);
    expect(missing.body.error.message).toContain("CBC");

    await upload(cbc.id);
    expect((await release()).status).toBe(204);
    expect(appointmentEmails.sent.at(-1)?.notice).toBe("results_ready_unpaid");
    expect((await release()).status).toBe(409);
    // Released results can't be replaced or removed
    expect((await upload(cbc.id)).status).toBe(409);
    const removed = await request(app)
      .delete(`/api/appointments/${visitId}/results/${cbc.id}`)
      .set(asDoctor);
    expect(removed.status).toBe(404);

    const visit = await request(app).get(`/api/appointments/${visitId}`).set(asDoctor);
    expect(visit.body.events.at(-1)).toMatchObject({ kind: "results_released" });
  });

  it("hides results from other patients", async () => {
    const { visitId, cbc, collect, upload, results, asOther, app, asDoctor } = await setup();
    await collect();
    await upload(cbc.id);
    await request(app).post(`/api/appointments/${visitId}/results/release`).set(asDoctor);
    expect((await results(asOther)).status).toBe(404);
  });
});

describe("the review queue and my results", () => {
  it("moves a visit from to upload, to ready, to released", async () => {
    const { app, visitId, cbc, collect, upload, asDoctor, asPatient } = await setup();
    await collect();
    const tab = async (name: string) =>
      (await request(app).get(`/api/results/queue?tab=${name}`).set(asDoctor)).body;

    expect((await tab("to_upload")).items).toMatchObject([
      { code: "HLC-000001", patientName: "Maria Santos", testsCollected: 1, testsWithResults: 0 },
    ]);
    await upload(cbc.id);
    expect((await tab("to_upload")).items).toHaveLength(0);
    expect((await tab("ready_to_release")).items).toHaveLength(1);

    await request(app).post(`/api/appointments/${visitId}/results/release`).set(asDoctor);
    expect((await tab("released")).items).toHaveLength(1);
    const mine = await request(app).get("/api/results/mine").set(asPatient);
    expect(mine.body).toMatchObject([{ code: "HLC-000001", state: "locked" }]);
  });

  it("needs results.review", async () => {
    const { app, asPatient } = await setup();
    expect((await request(app).get("/api/results/queue").set(asPatient)).status).toBe(403);
  });
});
