import type { AddressInfo } from "node:net";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { AppEvent } from "../../../src/application/ports/EventPublisher.js";
import { appointments, leaveRequests } from "../../../src/infrastructure/db/schema/index.js";
import { buildTestApp, signIn } from "../support/testApp.js";

// The fixed clock reads 4:00 PM on Thursday 15 January 2026 in Manila
const TODAY = "2026-01-15";
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

type Who = Record<string, string>;

async function setup() {
  const testApp = await buildTestApp();
  const { given, app, db } = testApp;
  const admin = await given.user({ email: "admin@example.com", role: "admin" });
  const ana = await given.user({
    email: "ana@example.com",
    role: "support",
    firstName: "Ana",
    lastName: "Reyes",
  });
  const ben = await given.user({
    email: "ben@example.com",
    role: "support",
    firstName: "Ben",
    lastName: "Cruz",
  });
  const maria = await given.user({
    email: "maria@example.com",
    firstName: "Maria",
    lastName: "Santos",
  });
  const juan = await given.user({ email: "juan@example.com" });
  const as = {
    admin: await signIn(app, "admin@example.com"),
    ana: await signIn(app, "ana@example.com"),
    ben: await signIn(app, "ben@example.com"),
    maria: await signIn(app, "maria@example.com"),
    juan: await signIn(app, "juan@example.com"),
  };

  /** Opens a ticket as a multipart form, like the browser does. */
  const open = async (
    who: Who,
    fields: Record<string, string> = {},
    file: Buffer | null = null,
  ) => {
    let call = request(app).post("/api/support/tickets").set(who);
    const values = {
      subject: "Where are my results?",
      category: "results",
      message: "It's been three days.",
      ...fields,
    };
    for (const [name, value] of Object.entries(values)) call = call.field(name, value);
    if (file) call = call.attach("file", file, "scan.png");
    return await call;
  };
  const post = async (who: Who, ticketId: string, message: string, file: Buffer | null = null) => {
    let call = request(app).post(`/api/support/tickets/${ticketId}/messages`).set(who);
    call = call.field("message", message);
    if (file) call = call.attach("file", file, "receipt.png");
    return await call;
  };
  const ticket = async (who: Who, id: string) =>
    await request(app).get(`/api/support/tickets/${id}`).set(who);
  const queue = async (who: Who, query = "") =>
    await request(app).get(`/api/support/tickets?${query}`).set(who);
  const visit = async (patientUserId: string) => {
    const [row] = await db
      .insert(appointments)
      .values({
        patientUserId,
        visitDate: "2026-01-17",
        slotStart: "08:00",
        status: "confirmed",
        address: "12 Rizal St",
        subtotalCentavos: 70_000,
        discountCentavos: 0,
        totalCentavos: 70_000,
      })
      .returning({ id: appointments.id });
    return row!.id;
  };

  return {
    ...testApp,
    users: { admin, ana, ben, maria, juan },
    as,
    open,
    post,
    ticket,
    queue,
    visit,
  };
}

/** Streams that collect what the hub sends each user. */
function listen(hub: {
  connect(userId: string, client: { write(chunk: string): unknown }): unknown;
}) {
  const received = new Map<string, AppEvent[]>();
  return (userId: string) => {
    const events: AppEvent[] = [];
    received.set(userId, events);
    hub.connect(userId, {
      write: (frame: string) => events.push(JSON.parse(frame.split("data: ")[1]!) as AppEvent),
    });
    return events;
  };
}

describe("support tickets", () => {
  it("gives each new ticket to the least busy agent on shift", async () => {
    const { given, users, open, as, app, clock } = await setup();
    await given.shifts(users.ana.id, [TODAY], "08:00", "17:00");
    await given.shifts(users.ben.id, [TODAY], "08:00", "17:00");

    const first = await open(as.maria, {}, PNG);
    clock.advanceMinutes(1);
    const second = await open(as.maria, { subject: "Second" });
    clock.advanceMinutes(1);
    const third = await open(as.juan, { subject: "Third" });

    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({
      code: "TKT-000001",
      status: "assigned",
      category: "results",
    });
    const [a, b, c] = [first, second, third].map((res) => res.body.assignee.id);
    expect(new Set([a, b])).toEqual(new Set([users.ana.id, users.ben.id]));
    // A tie at one each: the agent who got a ticket longest ago
    expect(c).toBe(a);

    const dashboard = await request(app).get("/api/dashboard").set(as.ana);
    const tile = dashboard.body.stats.items.find(
      (item: { label: string }) => item.label === "Open tickets",
    );
    expect(tile.value).toBe(a === users.ana.id ? "2" : "1");
  });

  it("waits in the queue with nobody on shift, until an agent claims it", async () => {
    const { given, db, users, open, as, app, queue } = await setup();
    // Ana's shift ended at 2 PM; Ben is on leave today
    await given.shifts(users.ana.id, [TODAY], "06:00", "14:00");
    await given.shifts(users.ben.id, [TODAY], "08:00", "17:00");
    await db.insert(leaveRequests).values({
      userId: users.ben.id,
      type: "sick",
      startsOn: TODAY,
      endsOn: TODAY,
      reason: "Flu",
      status: "approved",
      chain: ["admin"],
    });

    const { body: created } = await open(as.maria);
    expect(created).toMatchObject({ status: "open", assignee: null });
    const unassigned = await queue(as.ana, "scope=unassigned");
    expect(unassigned.body.map((t: { id: string }) => t.id)).toEqual([created.id]);
    expect(unassigned.body[0].unread).toBe(1);

    expect(
      (await request(app).post(`/api/support/tickets/${created.id}/claim`).set(as.ana)).status,
    ).toBe(204);
    const taken = await request(app).post(`/api/support/tickets/${created.id}/claim`).set(as.ben);
    expect(taken.status).toBe(409);
    expect(taken.body.error.message).toBe("Ana Reyes already has this ticket.");
    expect((await queue(as.ana, "scope=mine")).body[0]).toMatchObject({
      status: "assigned",
      assignee: { id: users.ana.id, name: "Ana Reyes" },
    });
  });

  it("moves the status with each reply, counts unread messages and keeps files private", async () => {
    const { given, users, open, post, ticket, as, app } = await setup();
    await given.shifts(users.ana.id, [TODAY], "08:00", "17:00");
    const { body: created } = await open(as.maria);

    const opened = await ticket(as.ana, created.id);
    expect(opened.body.messages).toHaveLength(1);
    expect(opened.body.context).toEqual({ appointment: null, otherTickets: [] });
    expect((await post(as.ana, created.id, "Checking now.")).status).toBe(201);

    const mine = await request(app).get("/api/support/tickets/mine").set(as.maria);
    expect(mine.body[0]).toMatchObject({ status: "waiting_on_patient", unread: 1 });

    const reply = await post(as.maria, created.id, "Here's my receipt", PNG);
    expect(reply.status).toBe(201);
    expect(reply.body).toMatchObject({ fromPatient: true, author: { name: "Maria Santos" } });
    const { url } = reply.body.attachment;
    expect((await ticket(as.maria, created.id)).body).toMatchObject({
      status: "assigned",
      unread: 0,
      context: null,
    });

    const file = await request(app).get(url).set(as.maria);
    expect(file.status).toBe(200);
    expect(file.headers["content-type"]).toBe("image/png");
    expect((await request(app).get(url).set(as.ben)).status).toBe(200);
    expect((await request(app).get(url).set(as.juan)).status).toBe(404);

    const empty = await post(as.maria, created.id, "  ");
    expect(empty.status).toBe(400);
    expect(empty.body.error.message).toBe("Write a message or attach a file.");
    const notAFile = await post(as.maria, created.id, "", Buffer.from("plain text"));
    expect(notAFile.body.error.message).toBe("Attach a PDF, or a JPG, PNG or WebP photo.");
  });

  it("only lets patients see and link their own", async () => {
    const { users, open, ticket, as, visit, queue } = await setup();
    const { body: created } = await open(as.maria);

    expect((await ticket(as.juan, created.id)).status).toBe(404);
    expect((await queue(as.maria)).status).toBe(403);
    const marias = await visit(users.maria.id);
    expect((await open(as.juan, { appointmentId: marias })).status).toBe(404);

    const linked = await open(as.maria, { appointmentId: marias });
    expect(linked.body.appointment.code).toMatch(/^HLC-\d{6}$/);
    const seen = await ticket(as.ben, linked.body.id);
    expect(seen.body.context.appointment).toMatchObject({
      id: marias,
      totalCentavos: 70_000,
      paymentStatus: "unpaid",
    });
    expect(seen.body.context.otherTickets.map((t: { id: string }) => t.id)).toEqual([created.id]);
  });

  it("closes, takes one rating, and reopens on the patient's reply within a week", async () => {
    const { given, users, open, post, ticket, as, app, clock } = await setup();
    await given.shifts(users.ana.id, [TODAY], "08:00", "17:00");
    const { body: created } = await open(as.maria);
    const close = async (who: Who) =>
      await request(app).post(`/api/support/tickets/${created.id}/close`).set(who);
    const rate = async (rating: number) =>
      await request(app)
        .post(`/api/support/tickets/${created.id}/rating`)
        .set(as.maria)
        .send({ rating, comment: "Quick help" });

    expect((await rate(5)).status).toBe(409);
    expect((await close(as.maria)).status).toBe(204);
    expect((await post(as.ana, created.id, "One more thing")).status).toBe(409);
    expect((await rate(5)).status).toBe(204);
    expect((await rate(4)).body.error.message).toBe("You've already rated this ticket.");
    expect((await ticket(as.maria, created.id)).body).toMatchObject({
      status: "closed",
      rating: 5,
      ratingComment: "Quick help",
      canReopen: true,
    });

    expect((await post(as.maria, created.id, "Actually, one more question")).status).toBe(201);
    expect((await ticket(as.maria, created.id)).body).toMatchObject({
      status: "assigned",
      closedAt: null,
    });

    expect((await close(as.ana)).status).toBe(204);
    clock.advanceMinutes(8 * 24 * 60);
    const late = await post(as.maria, created.id, "Hello?");
    expect(late.status).toBe(409);
    expect(late.body.error.message).toBe(
      "This ticket was closed over a week ago. Open a new ticket instead.",
    );
  });

  it("lets admins reassign, support set the priority, and logs both", async () => {
    const { given, users, open, as, app, queue } = await setup();
    await given.shifts(users.ana.id, [TODAY], "08:00", "17:00");
    const { body: first } = await open(as.maria);
    const { body: second } = await open(as.maria, { subject: "Refund" });
    const reassign = async (who: Who, assigneeId: string) =>
      await request(app)
        .patch(`/api/support/tickets/${second.id}/assignee`)
        .set(who)
        .send({ assigneeId });

    expect((await reassign(as.ana, users.ben.id)).status).toBe(403);
    const agents = await request(app).get("/api/support/agents").set(as.admin);
    expect(agents.body.map((agent: { name: string }) => agent.name)).toContain("Ben Cruz");
    expect((await reassign(as.admin, users.maria.id)).status).toBe(400);
    expect((await reassign(as.admin, users.ben.id)).status).toBe(204);

    const priority = await request(app)
      .patch(`/api/support/tickets/${second.id}/priority`)
      .set(as.ben)
      .send({ priority: "high" });
    expect(priority.status).toBe(204);
    const all = await queue(as.ana, "scope=all");
    expect(all.body.map((t: { id: string }) => t.id)).toEqual([second.id, first.id]);
    expect(all.body[0]).toMatchObject({ priority: "high", assignee: { name: "Ben Cruz" } });
    expect((await queue(as.ana, "scope=all&priority=low")).body).toEqual([]);
    expect((await queue(as.ana, "scope=all&q=refund")).body).toHaveLength(1);

    const log = await request(app).get("/api/audit?group=support").set(as.admin);
    expect(log.body.items.map((entry: { action: string }) => entry.action)).toEqual([
      "support.set_priority",
      "support.reassign",
    ]);
  });

  it("pushes changes to the patient and support as they happen", async () => {
    const { given, users, open, post, as, events } = await setup();
    await given.shifts(users.ana.id, [TODAY], "08:00", "17:00");
    const watch = listen(events);
    const [toAna, toMaria, toJuan] = [
      watch(users.ana.id),
      watch(users.maria.id),
      watch(users.juan.id),
    ];

    const { body: created } = await open(as.maria);
    await post(as.ana, created.id, "On it");

    expect(toAna).toEqual([
      expect.objectContaining({
        type: "ticket.updated",
        ticketId: created.id,
        change: "assigned",
        assigneeId: users.ana.id,
      }),
      expect.objectContaining({ type: "ticket.message", actorName: "Ana Reyes" }),
    ]);
    expect(toMaria.map((event) => event.type)).toEqual(["ticket.updated", "ticket.message"]);
    expect(toJuan).toEqual([]);
  });

  it("streams events at /api/events to signed-in users only", async () => {
    const { given, users, open, as, app } = await setup();
    await given.shifts(users.ana.id, [TODAY], "08:00", "17:00");
    expect((await request(app).get("/api/events")).status).toBe(401);

    const server = app.listen(0);
    const controller = new AbortController();
    try {
      const { port } = server.address() as AddressInfo;
      const res = await fetch(`http://127.0.0.1:${port}/api/events`, {
        headers: as.ana,
        signal: controller.signal,
      });
      expect(res.headers.get("content-type")).toContain("text/event-stream");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      const readUntil = async (part: string) => {
        while (!text.includes(part)) text += decoder.decode((await reader.read()).value);
      };
      await readUntil("retry: 3000");

      await open(as.maria);
      await readUntil("event: ticket.updated");
      expect(text).toContain(`"assigneeId":"${users.ana.id}"`);
    } finally {
      controller.abort();
      server.close();
    }
  });
});
