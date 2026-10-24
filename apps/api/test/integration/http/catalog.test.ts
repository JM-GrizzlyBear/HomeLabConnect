import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../../support/testApp.js";

type TestApp = ReturnType<typeof buildTestApp>;

async function loginAs(app: TestApp["app"], email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password123" });
  return { Authorization: `Bearer ${res.body.token as string}` };
}

async function setup() {
  const testApp = buildTestApp();
  testApp.users.add({ email: "admin@example.com", role: "admin" });
  testApp.users.add({ email: "patient@example.com", role: "patient" });
  const hematology = testApp.categories.add("Hematology");
  return {
    ...testApp,
    hematology,
    admin: await loginAs(testApp.app, "admin@example.com"),
    patient: await loginAs(testApp.app, "patient@example.com"),
  };
}

const vitaminD = (categoryId: string) => ({
  code: "vit-d",
  name: "Vitamin D",
  categoryId,
  priceCentavos: 180_000,
  specimen: "blood",
  turnaroundHours: 72,
  fastingHours: 0,
  preparation: null,
  description: null,
});

describe("/api/catalog/procedures", () => {
  it("lets an admin create, read, update and deactivate a procedure", async () => {
    const { app, admin, hematology } = await setup();

    const created = await request(app)
      .post("/api/catalog/procedures")
      .set(admin)
      .send(vitaminD(hematology.id));
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      code: "VIT-D",
      isActive: true,
      category: { id: hematology.id, name: "Hematology" },
    });
    const id = created.body.id as string;

    const updated = await request(app)
      .put(`/api/catalog/procedures/${id}`)
      .set(admin)
      .send({ ...vitaminD(hematology.id), priceCentavos: 200_000 });
    expect(updated.body.priceCentavos).toBe(200_000);

    const off = await request(app)
      .patch(`/api/catalog/procedures/${id}/status`)
      .set(admin)
      .send({ isActive: false });
    expect(off.body.isActive).toBe(false);

    const inactive = await request(app).get("/api/catalog/procedures?status=inactive").set(admin);
    expect(inactive.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
  });

  it("shows patients only active procedures and refuses their changes", async () => {
    const { app, patient, procedures, hematology } = await setup();
    procedures.add({ code: "CBC", categoryId: hematology.id });
    const old = procedures.add({ code: "OLD", categoryId: hematology.id, isActive: false });

    const list = await request(app).get("/api/catalog/procedures?status=inactive").set(patient);
    expect(list.status).toBe(200);
    expect(list.body.items.map((item: { code: string }) => item.code)).toEqual(["CBC"]);

    expect((await request(app).get(`/api/catalog/procedures/${old.id}`).set(patient)).status).toBe(
      404,
    );
    expect(
      (
        await request(app)
          .post("/api/catalog/procedures")
          .set(patient)
          .send(vitaminD(hematology.id))
      ).status,
    ).toBe(403);
  });

  it("returns 409 procedure_code_taken for a duplicate code", async () => {
    const { app, admin, procedures, hematology } = await setup();
    procedures.add({ code: "VIT-D", name: "Something else", categoryId: hematology.id });

    const res = await request(app)
      .post("/api/catalog/procedures")
      .set(admin)
      .send(vitaminD(hematology.id));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("procedure_code_taken");
  });

  it("returns 400 with field issues for a bad price", async () => {
    const { app, admin, hematology } = await setup();

    const res = await request(app)
      .post("/api/catalog/procedures")
      .set(admin)
      .send({ ...vitaminD(hematology.id), priceCentavos: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.issues[0].path).toBe("priceCentavos");
  });
});

describe("/api/catalog/categories", () => {
  it("lists categories with counts and refuses to delete one in use", async () => {
    const { app, admin, patient, procedures, hematology } = await setup();
    procedures.add({ code: "CBC", categoryId: hematology.id });

    const list = await request(app).get("/api/catalog/categories").set(patient);
    expect(list.body).toEqual([{ id: hematology.id, name: "Hematology", procedureCount: 1 }]);

    const created = await request(app)
      .post("/api/catalog/categories")
      .set(admin)
      .send({ name: "Chemistry" });
    expect(created.status).toBe(201);

    const inUse = await request(app).delete(`/api/catalog/categories/${hematology.id}`).set(admin);
    expect(inUse.status).toBe(409);
    expect(inUse.body.error.code).toBe("category_in_use");

    const removed = await request(app)
      .delete(`/api/catalog/categories/${created.body.id as string}`)
      .set(admin);
    expect(removed.status).toBe(204);
  });

  it("needs procedures.manage to change categories", async () => {
    const { app, patient } = await setup();

    const res = await request(app)
      .post("/api/catalog/categories")
      .set(patient)
      .send({ name: "Chemistry" });

    expect(res.status).toBe(403);
  });
});
