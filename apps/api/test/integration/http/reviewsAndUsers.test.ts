import request from "supertest";
import { describe, expect, it } from "vitest";
import { appointments } from "../../../src/infrastructure/db/schema/index.js";
import { buildTestApp, signIn } from "../support/testApp.js";

type Who = Record<string, string>;

async function setup() {
  const testApp = await buildTestApp();
  const { app, given, db } = testApp;
  await given.user({ email: "admin@example.com", role: "admin" });
  await given.user({ email: "support@example.com", role: "support" });
  const maria = await given.user({ email: "maria@example.com", phone: "09171234567" });
  const juan = await given.user({ email: "juan@example.com", phone: "09181234567" });
  const as = {
    admin: await signIn(app, "admin@example.com"),
    support: await signIn(app, "support@example.com"),
    maria: await signIn(app, "maria@example.com"),
    juan: await signIn(app, "juan@example.com"),
  };
  /** A visit booked on Thursday 15 January 2026, in the state asked for. */
  const visit = async (patientUserId: string, status: "collected" | "confirmed") => {
    const [row] = await db
      .insert(appointments)
      .values({
        patientUserId,
        visitDate: "2026-01-17",
        slotStart: "08:00",
        status,
        address: "12 Rizal St",
        subtotalCentavos: 70_000,
        discountCentavos: 0,
        totalCentavos: 70_000,
        createdAt: new Date("2026-01-15T02:00:00Z"),
      })
      .returning({ id: appointments.id });
    return row!.id;
  };
  return { ...testApp, as, users: { maria, juan }, visit };
}

describe("visit reviews", () => {
  it("lets the patient rate a finished visit once, and shows it to staff and in the report", async () => {
    const { app, as, users, visit } = await setup();
    const done = await visit(users.maria.id, "collected");
    const upcoming = await visit(users.maria.id, "confirmed");
    const rate = async (who: Who, id: string, rating = 5) =>
      await request(app)
        .post(`/api/appointments/${id}/review`)
        .set(who)
        .send({ rating, comment: "  Gentle and on time  " });

    expect((await rate(as.maria, upcoming)).status).toBe(409);
    expect((await rate(as.juan, done)).status).toBe(404);
    expect((await rate(as.support, done)).status).toBe(403);

    const rated = await rate(as.maria, done, 4);
    expect(rated.status).toBe(201);
    expect(rated.body).toMatchObject({ rating: 4, comment: "Gentle and on time" });
    expect((await rate(as.maria, done)).body.error.message).toBe(
      "You've already rated this visit.",
    );

    expect(
      (await request(app).get(`/api/appointments/${done}/review`).set(as.support)).body,
    ).toMatchObject({ rating: 4 });
    expect(
      (await request(app).get(`/api/appointments/${upcoming}/review`).set(as.maria)).body,
    ).toBeNull();
    expect((await request(app).get(`/api/appointments/${done}/review`).set(as.juan)).status).toBe(
      404,
    );

    const report = await request(app)
      .get("/api/reports/bookings?from=2026-01-15&to=2026-01-15&period=day")
      .set(as.admin);
    expect(report.body.ratings).toEqual({ average: 4, count: 1 });
  });
});

describe("user admin", () => {
  it("edits a user's details, refusing a taken email or a patient without a phone", async () => {
    const { app, as, users } = await setup();
    const edit = async (changes: Record<string, unknown>) =>
      await request(app)
        .patch(`/api/users/${users.maria.id}`)
        .set(as.admin)
        .send({
          firstName: "Maria",
          lastName: "Santos",
          email: "maria@example.com",
          phone: "09171234567",
          ...changes,
        });

    const edited = await edit({ lastName: "Reyes", email: "Maria.Reyes@Example.com" });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ lastName: "Reyes", email: "maria.reyes@example.com" });
    expect((await edit({ email: "juan@example.com" })).body.error.code).toBe("email_taken");
    expect((await edit({ phone: null })).body.error.code).toBe("phone_required");
    expect(
      (await request(app).patch(`/api/users/${users.maria.id}`).set(as.support).send({})).status,
    ).toBe(403);
  });

  it("exports the filtered user list as CSV", async () => {
    const { app, as } = await setup();
    const csv = await request(app).get("/api/users/export?role=patient").set(as.admin);
    expect(csv.status).toBe(200);
    expect(csv.headers["content-type"]).toContain("text/csv");
    const lines = csv.text.trim().split("\r\n");
    expect(lines[0]).toContain("First name,Last name,Email");
    expect(
      lines
        .slice(1)
        .map((line) => line.split(",")[2])
        .sort(),
    ).toEqual(["juan@example.com", "maria@example.com"]);
    expect((await request(app).get("/api/users/export").set(as.support)).status).toBe(403);
  });

  it("grants and denies one person a permission, until a date", async () => {
    const { app, as, users, clock } = await setup();
    const override = async (overrides: unknown[], who = as.admin, id = users.maria.id) =>
      await request(app).put(`/api/users/${id}/permissions`).set(who).send({ overrides });
    const seesPayments = async () => (await request(app).get("/api/payments").set(as.maria)).status;

    expect(await seesPayments()).toBe(403);
    const set = await override([
      { key: "payments.view_all", effect: "grant", until: "2026-01-15" },
      { key: "support.create_ticket", effect: "deny", until: null },
    ]);
    expect(set.status).toBe(200);
    expect(set.body.permissions).toContainEqual({
      key: "payments.view_all",
      inherited: false,
      granted: true,
      source: "override",
    });
    expect(await seesPayments()).toBe(200);
    expect(
      (await request(app).post("/api/support/tickets").set(as.maria).field("subject", "x")).status,
    ).toBe(403);

    // The grant ends at midnight in Manila (16:00 UTC); the denial stays
    clock.advanceMinutes(8 * 60 + 1);
    expect(await seesPayments()).toBe(403);
    const after = await request(app).get(`/api/users/${users.maria.id}/permissions`).set(as.admin);
    expect(after.body.overrides).toEqual([
      { key: "support.create_ticket", effect: "deny", until: null },
    ]);

    const me = (await request(app).get("/api/auth/me").set(as.admin)).body.id;
    expect((await override([], as.admin, me)).body.error.code).toBe(
      "cannot_override_own_permissions",
    );
    expect(
      (await override([{ key: "payments.view_all", effect: "grant", until: "2026-01-01" }])).body
        .error.message,
    ).toBe("An end date can't be in the past.");
    expect((await override([], as.support)).status).toBe(403);

    const log = await request(app).get("/api/audit?group=users").set(as.admin);
    expect(log.body.items.map((entry: { action: string }) => entry.action)).toContain(
      "permissions.override",
    );
  });
});
