import { sql } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { AppEvent } from "../../../src/application/ports/EventPublisher.js";
import { buildTestApp, signIn } from "../support/testApp.js";

const VISIT_DATE = "2026-01-17";

type Who = Record<string, string>;
interface Item {
  id: string;
  kind: string;
  title: string;
  link: string;
  readAt: string | null;
}

/**
 * A clinic with every role: Juan leads Team 1 with Paolo; both work the visit day. Bookings
 * need staff approval and teams are assigned by hand (the default settings).
 */
async function setup() {
  const testApp = await buildTestApp();
  const { given, app } = testApp;
  await given.user({ email: "admin@example.com", role: "admin" });
  await given.user({ email: "support@example.com", role: "support" });
  await given.user({ email: "doctor@example.com", role: "doctor" });
  await given.user({ email: "maria@example.com" });
  const juan = await given.user({ email: "juan@example.com", role: "med_team" });
  const paolo = await given.user({
    email: "paolo@example.com",
    role: "med_team",
    firstName: "Paolo",
    lastName: "Garcia",
  });
  const team = await given.team({ name: "Team 1" });
  await given.roster({
    teamId: team.id,
    periodStart: "2026-01-05",
    leadUserId: juan.id,
    memberIds: [juan.id, paolo.id],
  });
  await given.shifts(juan.id, [VISIT_DATE]);
  await given.shifts(paolo.id, [VISIT_DATE]);
  const category = await given.category("Hematology");
  const cbc = await given.procedure({ code: "CBC", categoryId: category.id });

  const as = {
    admin: await signIn(app, "admin@example.com"),
    support: await signIn(app, "support@example.com"),
    doctor: await signIn(app, "doctor@example.com"),
    maria: await signIn(app, "maria@example.com"),
    juan: await signIn(app, "juan@example.com"),
    paolo: await signIn(app, "paolo@example.com"),
  };
  const book = async (slot = "08:00") =>
    (
      await request(app)
        .post("/api/appointments")
        .set(as.maria)
        .send({
          procedureIds: [cbc.id],
          date: VISIT_DATE,
          slot,
          address: "12 Rizal St",
          landmark: null,
          notes: null,
        })
    ).body as { id: string; code: string };
  const bell = async (who: Who, query = "") =>
    (await request(app).get(`/api/notifications${query}`).set(who)).body as {
      items: Item[];
      total: number;
      unread: number;
    };
  const kinds = async (who: Who) => (await bell(who)).items.map((item) => item.kind);
  return { ...testApp, as, users: { juan, paolo }, team, book, bell, kinds };
}

describe("notifications", () => {
  it("follows a visit: the booking, its team, the doctors and the patient each hear their part", async () => {
    const { app, as, team, book, bell, kinds, clock } = await setup();
    const visit = await book();
    clock.advanceMinutes(1);

    expect(await kinds(as.support)).toEqual(["booking_pending"]);
    expect(await kinds(as.admin)).toEqual(["booking_pending"]);
    const [received] = (await bell(as.maria)).items;
    expect(received).toMatchObject({
      kind: "received",
      title: `Booking ${visit.code} received`,
      link: `/app/appointments/${visit.id}`,
    });

    await request(app).post(`/api/appointments/${visit.id}/accept`).set(as.admin);
    await request(app).put(`/api/appointments/${visit.id}/team`).set(as.admin).send({
      teamId: team.id,
    });
    expect(await kinds(as.maria)).toEqual(["confirmed", "received"]);
    expect(await kinds(as.juan)).toEqual(["visit_assigned"]);
    expect((await bell(as.paolo)).items[0]?.title).toBe(
      `Visit ${visit.code} assigned to your team`,
    );
    expect(await kinds(as.doctor)).toEqual([]);

    await request(app).post(`/api/visits/${visit.id}`).set(as.juan).send({ outcome: "on_the_way" });
    const collected = await request(app)
      .post(`/api/visits/${visit.id}`)
      .set(as.juan)
      .send({
        outcome: "collected",
        collectedProcedureIds: (
          await request(app).get(`/api/appointments/${visit.id}`).set(as.admin)
        ).body.lines.map((line: { procedureId: string }) => line.procedureId),
        note: null,
      });
    expect(collected.status).toBe(200);
    expect((await bell(as.doctor)).items[0]).toMatchObject({
      kind: "results_to_review",
      link: "/app/results/review",
    });
  });

  it("tells the team and the admins when a paid visit is cancelled", async () => {
    const { app, db, as, team, book, kinds } = await setup();
    const visit = await book();
    await request(app).post(`/api/appointments/${visit.id}/accept`).set(as.admin);
    await request(app).put(`/api/appointments/${visit.id}/team`).set(as.admin).send({
      teamId: team.id,
    });
    await db.execute(sql`update appointments set payment_status = 'paid'`);

    const cancelled = await request(app)
      .patch(`/api/appointments/${visit.id}/cancel`)
      .set(as.admin)
      .send({ reason: "Patient is travelling" });
    expect(cancelled.status).toBe(200);

    expect(await kinds(as.juan)).toContain("visit_cancelled");
    expect(await kinds(as.paolo)).toContain("visit_cancelled");
    expect(await kinds(as.admin)).toContain("refund_needed");
    expect(await kinds(as.support)).toEqual(["booking_pending"]);
    expect(await kinds(as.maria)).toContain("cancelled");
  });

  it("walks a leave request from the team lead to the admins and back to the requester", async () => {
    const { app, as, kinds, bell } = await setup();
    const filed = await request(app).post("/api/leave").set(as.paolo).send({
      type: "vacation",
      startsOn: "2026-01-16",
      endsOn: "2026-01-17",
      reason: "Family trip",
    });
    expect(filed.status).toBe(201);
    const decide = async (who: Who) =>
      await request(app)
        .post(`/api/leave/${filed.body.id}/decision`)
        .set(who)
        .send({ decision: "approved", note: null });

    expect((await bell(as.juan)).items[0]).toMatchObject({
      kind: "leave_to_decide",
      title: "Leave request from Paolo Garcia",
      link: "/app/scheduling/leave",
    });
    expect(await kinds(as.admin)).toEqual([]);

    await decide(as.juan);
    expect(await kinds(as.admin)).toEqual(["leave_to_decide"]);
    await decide(as.admin);
    expect((await bell(as.paolo)).items[0]).toMatchObject({
      kind: "leave_decided",
      title: "Your leave was approved",
    });
  });

  it("lists your own, pages them, and marks them read", async () => {
    const { app, as, book, bell } = await setup();
    await book("08:00");
    await book("09:00");
    await book("10:00");

    const page = await bell(as.support, "?pageSize=2");
    expect(page).toMatchObject({ total: 3, unread: 3 });
    expect(page.items).toHaveLength(2);
    const [first] = page.items;

    expect(
      (await request(app).post(`/api/notifications/${first!.id}/read`).set(as.maria)).status,
    ).toBe(404);
    expect(
      (await request(app).post(`/api/notifications/${first!.id}/read`).set(as.support)).status,
    ).toBe(204);
    expect((await bell(as.support, "?unread=true")).total).toBe(2);

    expect((await request(app).post("/api/notifications/read-all").set(as.support)).status).toBe(
      204,
    );
    expect(await bell(as.support)).toMatchObject({ total: 3, unread: 0 });
    expect((await bell(as.admin)).unread).toBe(3);
    expect((await request(app).get("/api/notifications")).status).toBe(401);
  });

  it("rings the bell live for the people it's for", async () => {
    const { app, as, events, book } = await setup();
    const me = await request(app).get("/api/auth/me").set(as.support);
    const heard: AppEvent[] = [];
    events.connect(me.body.id, {
      write: (frame: string) => heard.push(JSON.parse(frame.split("data: ")[1]!) as AppEvent),
    });

    const visit = await book();

    expect(heard).toEqual([
      expect.objectContaining({
        type: "notification.new",
        title: `New booking ${visit.code}`,
        link: `/app/appointments/${visit.id}`,
      }),
    ]);
  });
});
