import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

async function setup() {
  const testApp = await buildTestApp();
  await testApp.given.user({ email: "admin@example.com", role: "admin" });
  await testApp.given.user({ email: "patient@example.com", role: "patient" });
  await testApp.given.user({ email: "doctor@example.com", role: "doctor" });
  const hematology = await testApp.given.category("Hematology");
  const cbc = await testApp.given.procedure({
    code: "CBC",
    categoryId: hematology.id,
    priceCentavos: 35_000,
  });
  return {
    ...testApp,
    cbc,
    admin: await signIn(testApp.app, "admin@example.com"),
    patient: await signIn(testApp.app, "patient@example.com"),
    doctor: await signIn(testApp.app, "doctor@example.com"),
  };
}

const seniorWeek = {
  name: "Senior Week",
  description: null,
  discountType: "percent",
  value: 20,
  startsOn: "2026-01-12",
  endsOn: "2026-01-18",
  appliesTo: "all",
  procedureIds: [],
};

describe("/api/catalog/promotions", () => {
  it("lets an admin create a sale that lowers catalogue prices, then switch it off", async () => {
    const { app, admin, patient, cbc } = await setup();

    const created = await request(app).post("/api/catalog/promotions").set(admin).send(seniorWeek);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...seniorWeek, status: "running", isActive: true });

    const onSale = await request(app).get(`/api/catalog/procedures/${cbc.id}`).set(patient);
    expect(onSale.body.promotion).toEqual({
      id: created.body.id,
      name: "Senior Week",
      discountedPriceCentavos: 28_000,
    });

    const off = await request(app)
      .patch(`/api/catalog/promotions/${created.body.id as string}/status`)
      .set(admin)
      .send({ isActive: false });
    expect(off.body.status).toBe("off");

    const list = await request(app).get("/api/catalog/procedures").set(patient);
    expect(list.body.items[0].promotion).toBeNull();
  });

  it("creates a standing discount with no end date that keeps lowering prices", async () => {
    const { app, admin, cbc, clock } = await setup();

    const created = await request(app)
      .post("/api/catalog/promotions")
      .set(admin)
      .send({ ...seniorWeek, name: "Senior & PWD Discount", endsOn: null });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ endsOn: null, status: "running" });

    clock.advanceMinutes(5 * 365 * 24 * 60); // five years later, so sign in again
    const patient = await signIn(app, "patient@example.com");
    const res = await request(app).get(`/api/catalog/procedures/${cbc.id}`).set(patient);
    expect(res.body.promotion).toMatchObject({ discountedPriceCentavos: 28_000 });
  });

  it("updates a promotion's procedures", async () => {
    const { app, admin, cbc, given } = await setup();
    const existing = await given.promotion({ name: "Senior Week" });

    const res = await request(app)
      .put(`/api/catalog/promotions/${existing.id}`)
      .set(admin)
      .send({ ...seniorWeek, appliesTo: "selected", procedureIds: [cbc.id] });

    expect(res.status).toBe(200);
    expect(res.body.procedureIds).toEqual([cbc.id]);
  });

  it("shows patients running promotions only, and refuses their changes", async () => {
    const { app, patient, given } = await setup();
    await given.promotion({ name: "January Sale" });
    const later = await given.promotion({
      name: "March Sale",
      startsOn: "2026-03-01",
      endsOn: "2026-03-31",
    });

    const list = await request(app).get("/api/catalog/promotions").set(patient);
    expect(list.body.map((promotion: { name: string }) => promotion.name)).toEqual([
      "January Sale",
    ]);
    expect(
      (await request(app).get(`/api/catalog/promotions/${later.id}`).set(patient)).status,
    ).toBe(404);
    expect(
      (await request(app).post("/api/catalog/promotions").set(patient).send(seniorWeek)).status,
    ).toBe(403);
  });

  it("needs promotions.view to see promotions", async () => {
    const { app, doctor } = await setup();

    expect((await request(app).get("/api/catalog/promotions").set(doctor)).status).toBe(403);
  });

  it("puts each rule's message under its field", async () => {
    const { app, admin } = await setup();

    const res = await request(app)
      .post("/api/catalog/promotions")
      .set(admin)
      .send({ ...seniorWeek, value: 150, appliesTo: "selected", endsOn: "2026-01-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.issues.map((issue: { path: string }) => issue.path).sort()).toEqual([
      "endsOn",
      "procedureIds",
      "value",
    ]);
  });

  it("returns 409 promotion_name_taken for a duplicate name", async () => {
    const { app, admin, given } = await setup();
    await given.promotion({ name: "senior week" });

    const res = await request(app).post("/api/catalog/promotions").set(admin).send(seniorWeek);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("promotion_name_taken");
  });
});
