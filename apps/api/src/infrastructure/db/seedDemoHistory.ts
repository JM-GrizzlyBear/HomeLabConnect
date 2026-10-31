import { asc, eq, inArray } from "drizzle-orm";
import { addDays, businessDate, businessDateTime } from "../../domain/time/businessDate.js";
import type { Database } from "./client.js";
import {
  appointmentEvents,
  appointmentProcedures,
  appointmentReviews,
  appointments,
  chatMessages,
  chatParticipants,
  labProcedures,
  medTeams,
  notifications,
  paymentRefunds,
  payments,
  supportTickets,
  users,
} from "./schema/index.js";

type PastStatus = "collected" | "not_collected" | "cancelled" | "rejected";

/** [patient number, days ago, slot, outcome, tests, paid by, rating]. */
const pastVisits: [
  number,
  number,
  string,
  PastStatus,
  number,
  "cash" | "card" | null,
  number | null,
][] = [
  [1, 29, "07:00", "collected", 2, "cash", 5],
  [2, 27, "08:00", "collected", 1, "card", 4],
  [3, 26, "09:00", "collected", 3, "cash", null],
  [4, 24, "07:00", "cancelled", 1, null, null],
  [5, 23, "08:00", "collected", 2, "card", 5],
  [6, 21, "10:00", "not_collected", 1, null, 3],
  [7, 20, "07:00", "collected", 1, "cash", null],
  [8, 18, "08:00", "rejected", 2, null, null],
  [9, 17, "09:00", "collected", 2, "card", 5],
  [10, 15, "07:00", "collected", 3, "cash", 4],
  [11, 13, "08:00", "collected", 1, "card", null],
  [12, 12, "10:00", "cancelled", 2, "card", null],
  [13, 10, "07:00", "collected", 2, "cash", 5],
  [14, 9, "08:00", "collected", 1, "card", 4],
  [15, 7, "09:00", "not_collected", 2, null, null],
  [16, 6, "07:00", "collected", 2, "cash", null],
  [17, 4, "08:00", "collected", 3, "card", 5],
  [18, 3, "10:00", "collected", 1, "cash", null],
  [19, 2, "07:00", "collected", 2, "card", null],
  [20, 1, "08:00", "collected", 1, "cash", null],
];

/** Today's route for Team Makati: [patient number, slot, tests, paid by card already]. */
const todayVisits: [number, string, number, boolean][] = [
  [4, "07:00", 2, true],
  [6, "09:00", 1, false],
  [8, "11:00", 3, false],
];

const reasons: Partial<Record<PastStatus, string>> = {
  cancelled: "Patient is travelling that week.",
  rejected: "No team can reach that area yet.",
  not_collected: "Nobody was home at the visit time.",
};

const at = (date: string, time: string) => businessDateTime(date, time);

/**
 * A month of past visits (payments, a refund, ratings), today's route for Team Makati, a few
 * support tickets and some notifications, so every dashboard, report and inbox has something to
 * show in a demo. Only runs once: on a database with no ratings and no tickets yet.
 */
export async function seedDemoHistory(
  db: Database,
  emailDomain: string,
  now = new Date(),
): Promise<number> {
  const [[reviewed], [ticketed]] = await Promise.all([
    db.select({ id: appointmentReviews.appointmentId }).from(appointmentReviews).limit(1),
    db.select({ id: supportTickets.id }).from(supportTickets).limit(1),
  ]);
  if (reviewed || ticketed) return 0;

  const people = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      inArray(users.email, [
        ...pastVisits.map(([n]) => `patient${String(n).padStart(2, "0")}@${emailDomain}`),
        `admin@${emailDomain}`,
        `support@${emailDomain}`,
        `medteam@${emailDomain}`,
        `doctor@${emailDomain}`,
      ]),
    );
  const idOf = (local: string) => people.find((p) => p.email === `${local}@${emailDomain}`)?.id;
  const [admin, support, medTech, doctor] = ["admin", "support", "medteam", "doctor"].map(idOf);
  const tests = await db
    .select()
    .from(labProcedures)
    .where(eq(labProcedures.isActive, true))
    .orderBy(asc(labProcedures.code))
    .limit(3);
  const [makati] = await db
    .select({ id: medTeams.id })
    .from(medTeams)
    .where(eq(medTeams.name, "Team Makati"));
  if (!admin || !support || tests.length === 0 || !makati) return 0;

  const today = businessDate(now);
  const visitIds: string[] = [];
  for (const [n, daysAgo, slot, status, testCount, paidBy, rating] of pastVisits) {
    const patientId = idOf(`patient${String(n).padStart(2, "0")}`);
    if (!patientId) continue;
    const date = addDays(today, -daysAgo);
    const booked = at(addDays(date, -3), "10:00");
    const chosen = tests.slice(0, testCount);
    const total = chosen.reduce((sum, test) => sum + test.priceCentavos, 0);
    const went = status === "collected" || status === "not_collected";
    const refunded = status === "cancelled" && paidBy !== null;

    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(appointments)
        .values({
          patientUserId: patientId,
          visitDate: date,
          slotStart: slot,
          status,
          address: "Makati City, Metro Manila",
          subtotalCentavos: total,
          discountCentavos: 0,
          totalCentavos: total,
          paymentStatus: refunded ? "refunded" : paidBy ? "paid" : "unpaid",
          decisionNote: status === "cancelled" || status === "rejected" ? reasons[status] : null,
          collectionNote: status === "not_collected" ? reasons.not_collected : null,
          teamId: went ? makati.id : null,
          createdAt: booked,
          updatedAt: at(date, slot),
        })
        .returning({ id: appointments.id });
      if (!row) return;
      visitIds.push(row.id);
      await tx.insert(appointmentProcedures).values(
        chosen.map((test, position) => ({
          appointmentId: row.id,
          procedureId: test.id,
          position,
          code: test.code,
          name: test.name,
          priceCentavos: test.priceCentavos,
          discountCentavos: 0,
          collected: went ? status === "collected" : null,
        })),
      );
      await tx.insert(appointmentEvents).values([
        { appointmentId: row.id, actorId: patientId, kind: "booked", at: booked },
        ...(status === "rejected"
          ? [{ appointmentId: row.id, actorId: support, kind: "rejected", at: booked }]
          : [{ appointmentId: row.id, actorId: support, kind: "confirmed", at: booked }]),
        ...(went
          ? [
              {
                appointmentId: row.id,
                actorId: medTech ?? null,
                kind: status,
                at: at(date, slot),
              },
            ]
          : []),
        ...(status === "cancelled"
          ? [
              {
                appointmentId: row.id,
                actorId: patientId,
                kind: "cancelled",
                at: at(addDays(date, -1), "09:00"),
              },
            ]
          : []),
      ]);
      if (paidBy) {
        const paidAt = paidBy === "cash" ? at(date, slot) : at(addDays(date, -2), "12:00");
        const [payment] = await tx
          .insert(payments)
          .values({
            appointmentId: row.id,
            provider: paidBy === "cash" ? "cash" : "stripe",
            status: refunded ? "refunded" : "paid",
            amountCentavos: total,
            refundedCentavos: refunded ? total : 0,
            providerReference: paidBy === "card" ? `demo_cs_${row.id}` : null,
            recordedBy: paidBy === "cash" ? (medTech ?? null) : null,
            paidAt,
          })
          .returning({ id: payments.id });
        if (payment && refunded) {
          await tx.insert(paymentRefunds).values({
            paymentId: payment.id,
            amountCentavos: total,
            reason: "Cancelled before the visit",
            refundedBy: admin,
          });
        }
      }
      if (rating && went) {
        await tx.insert(appointmentReviews).values({
          appointmentId: row.id,
          patientUserId: patientId,
          rating,
          comment:
            rating >= 5
              ? "Quick and gentle, thank you!"
              : rating <= 3
                ? "Please call before coming."
                : null,
          createdAt: at(date, "18:00"),
        });
      }
    });
  }

  for (const [n, slot, testCount, paid] of todayVisits) {
    const patientId = idOf(`patient${String(n).padStart(2, "0")}`);
    if (!patientId) continue;
    const chosen = tests.slice(0, testCount);
    const total = chosen.reduce((sum, test) => sum + test.priceCentavos, 0);
    const booked = at(addDays(today, -2), "15:00");
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(appointments)
        .values({
          patientUserId: patientId,
          visitDate: today,
          slotStart: slot,
          status: "confirmed",
          address: "Makati City, Metro Manila",
          subtotalCentavos: total,
          discountCentavos: 0,
          totalCentavos: total,
          paymentStatus: paid ? "paid" : "unpaid",
          teamId: makati.id,
          createdAt: booked,
        })
        .returning({ id: appointments.id });
      if (!row) return;
      visitIds.push(row.id);
      await tx.insert(appointmentProcedures).values(
        chosen.map((test, position) => ({
          appointmentId: row.id,
          procedureId: test.id,
          position,
          code: test.code,
          name: test.name,
          priceCentavos: test.priceCentavos,
          discountCentavos: 0,
        })),
      );
      await tx.insert(appointmentEvents).values([
        { appointmentId: row.id, actorId: patientId, kind: "booked", at: booked },
        { appointmentId: row.id, actorId: support, kind: "confirmed", at: booked },
        { appointmentId: row.id, actorId: support, kind: "team_assigned", at: booked },
      ]);
      if (paid) {
        await tx.insert(payments).values({
          appointmentId: row.id,
          provider: "stripe",
          status: "paid",
          amountCentavos: total,
          providerReference: `demo_cs_${row.id}`,
          paidAt: booked,
        });
      }
    });
  }

  await seedTickets(db, idOf, support, today);
  await seedNotifications(db, { admin, support, medTech, doctor, patient: idOf("patient01") }, now);
  return visitIds.length;
}

async function seedTickets(
  db: Database,
  idOf: (local: string) => string | undefined,
  support: string,
  today: string,
): Promise<void> {
  const tickets: [string, string, "booking" | "payment" | "results", string[], boolean][] = [
    [
      "patient01",
      "When will my results be ready?",
      "results",
      [
        "Hi! My visit was last week. When can I see my results?",
        "Hi! The lab is finishing them; you'll get an email as soon as they're released.",
      ],
      false,
    ],
    [
      "patient02",
      "Can I pay by GCash?",
      "payment",
      [
        "Do you accept GCash?",
        "We take card online or cash at the visit for now.",
        "OK, I'll pay by card. Thanks!",
      ],
      true,
    ],
    [
      "patient03",
      "Change my visit address",
      "booking",
      ["I moved last month. Can the team come to my new place in Taguig?"],
      false,
    ],
  ];
  for (const [local, subject, category, chat, closed] of tickets) {
    const patientId = idOf(local);
    if (!patientId) continue;
    const opened = at(addDays(today, -2), "09:00");
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        patientUserId: patientId,
        subject,
        category,
        status: closed ? "closed" : chat.length > 1 ? "waiting_on_patient" : "assigned",
        assignedTo: support,
        assignedAt: opened,
        closedAt: closed ? at(addDays(today, -1), "10:00") : null,
        closedBy: closed ? patientId : null,
        rating: closed ? 5 : null,
        lastMessageAt: opened,
        createdAt: opened,
        updatedAt: opened,
      })
      .returning({ id: supportTickets.id });
    if (!ticket) continue;
    const rows = await db
      .insert(chatMessages)
      .values(
        chat.map((body, i) => ({
          ticketId: ticket.id,
          authorId: i % 2 === 0 ? patientId : support,
          body,
          createdAt: new Date(opened.getTime() + i * 15 * 60_000),
        })),
      )
      .returning({ seq: chatMessages.seq });
    const last = Math.max(...rows.map((row) => row.seq));
    await db.insert(chatParticipants).values([
      { ticketId: ticket.id, userId: patientId, lastReadSeq: last },
      // The newest patient message is still unread for support
      {
        ticketId: ticket.id,
        userId: support,
        lastReadSeq: chat.length % 2 === 1 ? last - 1 : last,
      },
    ]);
  }
}

async function seedNotifications(
  db: Database,
  who: Record<"admin" | "support" | "medTech" | "doctor" | "patient", string | undefined>,
  now: Date,
): Promise<void> {
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);
  const rows = [
    [
      who.support,
      "booking_pending",
      "New booking waiting",
      "Open Appointments to accept or reject it.",
      "/app/appointments/all",
      30,
    ],
    [
      who.support,
      "booking_pending",
      "Patient 03 opened a ticket",
      "Change my visit address",
      "/app/support/queue",
      120,
    ],
    [
      who.admin,
      "refund_needed",
      "Refund needed",
      "A paid visit was cancelled.",
      "/app/payments/refunds",
      60,
    ],
    [
      who.admin,
      "leave_to_decide",
      "Leave request from Paolo Garcia",
      "Approve or reject it.",
      "/app/scheduling/leave",
      240,
    ],
    [
      who.medTech,
      "visit_assigned",
      "A visit was assigned to your team",
      "See today's route.",
      "/app/appointments/visits",
      45,
    ],
    [
      who.doctor,
      "results_to_review",
      "Samples collected",
      "Upload and release the results.",
      "/app/results/review",
      90,
    ],
    [
      who.patient,
      "confirmed",
      "Your visit is confirmed",
      "Our team will see you soon.",
      "/app/appointments/mine",
      15,
    ],
  ] as const;
  const values = rows.flatMap(([userId, kind, title, body, link, minutes]) =>
    userId ? [{ userId, kind, title, body, link, createdAt: ago(minutes) }] : [],
  );
  if (values.length > 0) await db.insert(notifications).values(values);
}
