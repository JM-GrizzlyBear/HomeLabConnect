import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp, signIn } from "../support/testApp.js";

// FixedClock: Thursday 2026-01-15, 4:00 PM Philippine time
const VISIT_DATE = "2026-01-17";

/** One med team on duty (tech1), a patient with a ₱700 visit (two tests), and an admin. */
async function setup({ cardPayments = true } = {}) {
  const testApp = await buildTestApp({ cardPayments });
  const { given, app } = testApp;
  await given.user({ email: "admin@example.com", role: "admin" });
  await given.user({ email: "maria@example.com", firstName: "Maria", lastName: "Santos" });
  await given.user({ email: "other@example.com" });
  const tech = await given.user({ email: "tech1@example.com", role: "med_team" });
  await given.user({ email: "tech2@example.com", role: "med_team" });
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

  const confirm = async () => {
    await request(app).post(`/api/appointments/${visitId}/accept`).set(asAdmin);
    await request(app)
      .put(`/api/appointments/${visitId}/team`)
      .set(asAdmin)
      .send({ teamId: team.id });
  };
  const onTheWay = async () => {
    await confirm();
    await request(app).post(`/api/visits/${visitId}`).set(asTech).send({ outcome: "on_the_way" });
  };
  const webhook = (event: object, signature = "valid") =>
    request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", signature)
      .send(JSON.stringify(event));

  return {
    ...testApp,
    visitId,
    asAdmin,
    asPatient,
    asTech,
    asOther: await signIn(app, "other@example.com"),
    asTech2: await signIn(app, "tech2@example.com"),
    confirm,
    onTheWay,
    webhook,
  };
}

describe("card payments", () => {
  it("opens a checkout once the visit is confirmed, and reuses it while it is open", async () => {
    const { app, asPatient, visitId, confirm, gateway } = await setup();

    const early = await request(app).post(`/api/appointments/${visitId}/checkout`).set(asPatient);
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe("payment_not_allowed");

    await confirm();
    const first = await request(app).post(`/api/appointments/${visitId}/checkout`).set(asPatient);
    expect(first.status).toBe(200);
    expect(first.body.url).toBe("https://checkout.example.com/cs_1");
    expect(gateway.checkouts).toEqual([
      { reference: "cs_1", amountCentavos: 70_000, code: "HLC-000001" },
    ]);

    const again = await request(app).post(`/api/appointments/${visitId}/checkout`).set(asPatient);
    expect(again.body.url).toBe("https://checkout.example.com/cs_1");
    expect(gateway.checkouts).toHaveLength(1);
  });

  it("answers 404 for someone else's visit", async () => {
    const { app, asOther, visitId, confirm } = await setup();
    await confirm();
    const res = await request(app).post(`/api/appointments/${visitId}/checkout`).set(asOther);
    expect(res.status).toBe(404);
  });

  it("marks the visit paid when Stripe says so, once, however often the event arrives", async () => {
    const { app, asPatient, visitId, confirm, webhook, appointmentEmails } = await setup();
    await confirm();
    await request(app).post(`/api/appointments/${visitId}/checkout`).set(asPatient);

    const event = { eventId: "evt_1", type: "checkout_completed", reference: "cs_1" };
    expect((await webhook(event)).status).toBe(200);
    expect((await webhook(event)).status).toBe(200);

    const visit = await request(app).get(`/api/appointments/${visitId}`).set(asPatient);
    expect(visit.body.paymentStatus).toBe("paid");
    expect(visit.body.events.filter((e: { kind: string }) => e.kind === "paid")).toHaveLength(1);
    expect(appointmentEmails.sent.filter((e) => e.notice === "payment_received")).toHaveLength(1);

    const payments = await request(app).get(`/api/appointments/${visitId}/payments`).set(asPatient);
    expect(payments.body).toMatchObject({
      cardEnabled: true,
      payments: [{ provider: "stripe", status: "paid", amountCentavos: 70_000 }],
    });
    const paidAgain = await request(app)
      .post(`/api/appointments/${visitId}/checkout`)
      .set(asPatient);
    expect(paidAgain.status).toBe(409);
  });

  it("refuses a webhook with a bad signature", async () => {
    const { webhook } = await setup();
    const res = await webhook(
      { eventId: "evt_1", type: "checkout_completed", reference: "cs_1" },
      "forged",
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_webhook");
  });

  it("is switched off without Stripe: no card, cash still works", async () => {
    const { app, asPatient, asTech, visitId, onTheWay } = await setup({ cardPayments: false });
    await onTheWay();

    const card = await request(app).post(`/api/appointments/${visitId}/checkout`).set(asPatient);
    expect(card.status).toBe(409);
    expect(card.body.error.code).toBe("card_payments_unavailable");
    const payments = await request(app).get(`/api/appointments/${visitId}/payments`).set(asPatient);
    expect(payments.body.cardEnabled).toBe(false);

    const cash = await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech);
    expect(cash.status).toBe(200);
  });
});

describe("cash payments", () => {
  it("lets the visit's team take cash once on the way", async () => {
    const { app, asTech, asPatient, visitId, confirm, appointmentEmails } = await setup();
    await confirm();
    const early = await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech);
    expect(early.status).toBe(409);

    await request(app).post(`/api/visits/${visitId}`).set(asTech).send({ outcome: "on_the_way" });
    const res = await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech);
    expect(res.status).toBe(200);
    expect(res.body.paymentStatus).toBe("paid");
    expect(res.body.events.at(-1)).toMatchObject({ kind: "paid", note: "Paid in cash." });
    expect(appointmentEmails.sent.at(-1)?.notice).toBe("payment_received");

    const twice = await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech);
    expect(twice.status).toBe(409);
    const mine = await request(app).get("/api/payments/mine").set(asPatient);
    expect(mine.body).toMatchObject([{ provider: "cash", amountCentavos: 70_000 }]);
  });

  it("refuses patients (403) and other teams (404)", async () => {
    const { app, asPatient, asTech2, visitId, onTheWay } = await setup();
    await onTheWay();
    expect(
      (await request(app).post(`/api/appointments/${visitId}/cash`).set(asPatient)).status,
    ).toBe(403);
    expect((await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech2)).status).toBe(
      404,
    );
  });
});

describe("paid twice", () => {
  it("closes an open card checkout when the team takes cash", async () => {
    const { app, asPatient, asTech, visitId, onTheWay, gateway } = await setup();
    await onTheWay();
    await request(app).post(`/api/appointments/${visitId}/checkout`).set(asPatient);

    await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech);
    expect(gateway.expired).toEqual(["cs_1"]);
  });

  it("still records a card payment that lands after cash, and flags it for a refund", async () => {
    const { app, asAdmin, asPatient, asTech, visitId, onTheWay, webhook, gateway } = await setup();
    await onTheWay();
    await request(app).post(`/api/appointments/${visitId}/checkout`).set(asPatient);
    // Stripe refused to expire it: the patient had just paid
    gateway.expireCheckout = async () => {
      throw new Error("already complete");
    };
    await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech);
    await webhook({ eventId: "evt_1", type: "checkout_completed", reference: "cs_1" });

    const flagged = await request(app).get("/api/payments?needsRefund=true").set(asAdmin);
    expect(flagged.body.items).toMatchObject([
      { provider: "stripe", status: "paid", needsRefund: true },
    ]);
    const visit = await request(app).get(`/api/appointments/${visitId}`).set(asAdmin);
    expect(visit.body.events.at(-1).note).toContain("already paid");
    const all = await request(app).get("/api/payments").set(asAdmin);
    const cash = all.body.items.find((p: { provider: string }) => p.provider === "cash");
    expect(cash.needsRefund).toBe(false);
  });
});

describe("all payments and refunds", () => {
  it("lists, exports and refunds part, then the rest", async () => {
    const { app, asAdmin, asTech, visitId, onTheWay, appointmentEmails } = await setup();
    await onTheWay();
    await request(app).post(`/api/appointments/${visitId}/cash`).set(asTech);

    const list = await request(app).get("/api/payments?q=santos").set(asAdmin);
    expect(list.body).toMatchObject({
      total: 1,
      items: [
        {
          provider: "cash",
          status: "paid",
          appointment: { code: "HLC-000001", patient: { name: "Maria Santos" } },
          needsRefund: false,
        },
      ],
    });
    const paymentId = list.body.items[0].id as string;

    const csv = await request(app).get("/api/payments/export?provider=cash").set(asAdmin);
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.headers["content-disposition"]).toContain('filename="payments-2026-01-15.csv"');
    expect(csv.text).toContain("HLC-000001,2026-01-17,Maria Santos,Cash,paid,700.00,0.00");

    const tooMuch = await request(app)
      .post(`/api/payments/${paymentId}/refunds`)
      .set(asAdmin)
      .send({ amountCentavos: 80_000, reason: "Overcharged" });
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.error.code).toBe("invalid_refund");

    const part = await request(app)
      .post(`/api/payments/${paymentId}/refunds`)
      .set(asAdmin)
      .send({ amountCentavos: 10_000, reason: "Senior discount missed" });
    expect(part.body).toMatchObject({ status: "partially_refunded", refundedCentavos: 10_000 });
    expect(appointmentEmails.sent.at(-1)?.notice).toBe("payment_refunded");

    const rest = await request(app)
      .post(`/api/payments/${paymentId}/refunds`)
      .set(asAdmin)
      .send({ amountCentavos: 60_000, reason: "Visit refunded" });
    expect(rest.body).toMatchObject({ status: "refunded", refundedCentavos: 70_000 });
    expect(rest.body.refunds).toHaveLength(2);
    const visit = await request(app).get(`/api/appointments/${visitId}`).set(asAdmin);
    expect(visit.body.paymentStatus).toBe("refunded");
  });

  it("refunds card payments through Stripe, and flags paid visits that were cancelled", async () => {
    const { app, asAdmin, asPatient, visitId, confirm, webhook, gateway } = await setup();
    await confirm();
    await request(app).post(`/api/appointments/${visitId}/checkout`).set(asPatient);
    await webhook({ eventId: "evt_1", type: "checkout_completed", reference: "cs_1" });
    await request(app)
      .patch(`/api/appointments/${visitId}/cancel`)
      .set(asPatient)
      .send({ reason: "Moving away" });

    const visit = await request(app).get(`/api/appointments/${visitId}`).set(asAdmin);
    expect(visit.body).toMatchObject({ status: "cancelled", needsRefund: true });
    const flagged = await request(app).get("/api/payments?needsRefund=true").set(asAdmin);
    expect(flagged.body.items).toHaveLength(1);

    await request(app)
      .post(`/api/payments/${flagged.body.items[0].id}/refunds`)
      .set(asAdmin)
      .send({ amountCentavos: 70_000, reason: "Cancelled visit" });
    expect(gateway.refunds).toEqual([{ reference: "cs_1", amountCentavos: 70_000 }]);
    const after = await request(app).get("/api/payments?needsRefund=true").set(asAdmin);
    expect(after.body.items).toHaveLength(0);
  });

  it("needs payments.view_all and payments.refund", async () => {
    const { app, asPatient, asTech } = await setup();
    expect((await request(app).get("/api/payments").set(asPatient)).status).toBe(403);
    expect((await request(app).get("/api/payments/export").set(asTech)).status).toBe(403);
    const refund = await request(app)
      .post("/api/payments/00000000-0000-4000-8000-000000000000/refunds")
      .set(asTech)
      .send({ amountCentavos: 100, reason: "Test" });
    expect(refund.status).toBe(403);
  });
});
