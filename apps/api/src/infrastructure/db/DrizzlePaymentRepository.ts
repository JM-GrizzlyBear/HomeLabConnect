import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { formatAppointmentCode } from "../../domain/appointments/appointment.js";
import {
  type Payment,
  type PaymentWithAppointment,
  statusAfterRefund,
} from "../../domain/payments/payment.js";
import type {
  PaymentListPage,
  PaymentListQuery,
  PaymentRepository,
} from "../../domain/payments/PaymentRepository.js";
import type { Database } from "./client.js";
import { likePattern } from "./likePattern.js";
import {
  appointmentEvents,
  appointments,
  paymentRefunds,
  payments,
  paymentWebhookEvents,
  users,
} from "./schema/index.js";

type PaymentRow = typeof payments.$inferSelect;

const patientName = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;
/** The day a payment was made (or opened), Philippine time. */
const businessDay = sql`(coalesce(${payments.paidAt}, ${payments.createdAt}) at time zone 'Asia/Manila')::date`;
const settled = inArray(payments.status, ["paid", "partially_refunded"]);

export class DrizzlePaymentRepository implements PaymentRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<PaymentWithAppointment | null> {
    const [payment] = await this.loadWithAppointments(eq(payments.id, id));
    return payment ?? null;
  }

  async findByReference(reference: string): Promise<Payment | null> {
    const [payment] = await this.load(eq(payments.providerReference, reference));
    return payment ?? null;
  }

  async listForAppointment(appointmentId: string): Promise<Payment[]> {
    return await this.load(eq(payments.appointmentId, appointmentId));
  }

  async list(
    query: PaymentListQuery,
    page: { page: number; pageSize: number } | null,
  ): Promise<PaymentListPage> {
    const filters: SQL[] = [];
    if (query.status) filters.push(eq(payments.status, query.status));
    if (query.provider) filters.push(eq(payments.provider, query.provider));
    if (query.from) filters.push(sql`${businessDay} >= ${query.from}`);
    if (query.to) filters.push(sql`${businessDay} <= ${query.to}`);
    if (query.patientId) filters.push(eq(appointments.patientUserId, query.patientId));
    if (query.refundable || query.needsRefund) filters.push(settled);
    if (query.needsRefund) {
      filters.push(
        or(
          inArray(appointments.status, ["cancelled", "rejected"]),
          eq(payments.duplicate, true),
        ) as SQL,
      );
    }
    if (query.q) {
      const number = Number(query.q.replace(/\D/g, ""));
      const matches: SQL[] = [ilike(patientName, likePattern(query.q))];
      if (Number.isInteger(number) && number > 0) matches.push(eq(appointments.number, number));
      filters.push(or(...matches) as SQL);
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [{ total } = { total: 0 }] = await this.db
      .select({ total: count() })
      .from(payments)
      .innerJoin(appointments, eq(appointments.id, payments.appointmentId))
      .innerJoin(users, eq(users.id, appointments.patientUserId))
      .where(where);
    const items = await this.loadWithAppointments(where, page);
    return { items, total };
  }

  async createPending(input: {
    appointmentId: string;
    amountCentavos: number;
    reference: string;
    checkoutUrl: string;
  }): Promise<Payment> {
    const [row] = await this.db
      .insert(payments)
      .values({
        appointmentId: input.appointmentId,
        provider: "stripe",
        status: "pending",
        amountCentavos: input.amountCentavos,
        providerReference: input.reference,
        checkoutUrl: input.checkoutUrl,
      })
      .returning();
    if (!row) throw new Error("Insert into payments returned no row.");
    return toPayment(row, []);
  }

  async markPaid(paymentId: string, paidAt: Date): Promise<boolean> {
    return await this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(payments)
        .set({ status: "paid", paidAt, checkoutUrl: null })
        .where(and(eq(payments.id, paymentId), eq(payments.status, "pending")))
        .returning();
      if (!row) return false;
      // Only an unpaid visit becomes paid: if cash was taken meanwhile, the card payment is
      // still recorded (the money was taken) and shows as needing a refund
      const [visit] = await tx
        .update(appointments)
        .set({ paymentStatus: "paid" })
        .where(
          and(eq(appointments.id, row.appointmentId), eq(appointments.paymentStatus, "unpaid")),
        )
        .returning({ id: appointments.id });
      if (!visit) {
        await tx.update(payments).set({ duplicate: true }).where(eq(payments.id, row.id));
      }
      await tx.insert(appointmentEvents).values({
        appointmentId: row.appointmentId,
        actorId: null,
        kind: "paid",
        note: visit
          ? "Paid by card."
          : "Paid by card, but the visit was already paid: refund one payment.",
      });
      return true;
    });
  }

  async markExpired(paymentId: string): Promise<void> {
    await this.db
      .update(payments)
      .set({ status: "expired", checkoutUrl: null })
      .where(and(eq(payments.id, paymentId), eq(payments.status, "pending")));
  }

  async recordCash(input: {
    appointmentId: string;
    amountCentavos: number;
    actorId: string;
    paidAt: Date;
  }): Promise<Payment | null> {
    return await this.db.transaction(async (tx) => {
      // Locks the appointment so a card payment can't land at the same moment
      const [appointment] = await tx
        .update(appointments)
        .set({ paymentStatus: "paid" })
        .where(
          and(eq(appointments.id, input.appointmentId), eq(appointments.paymentStatus, "unpaid")),
        )
        .returning({ id: appointments.id });
      if (!appointment) return null;
      const [row] = await tx
        .insert(payments)
        .values({
          appointmentId: input.appointmentId,
          provider: "cash",
          status: "paid",
          amountCentavos: input.amountCentavos,
          recordedBy: input.actorId,
          paidAt: input.paidAt,
        })
        .returning();
      if (!row) throw new Error("Insert into payments returned no row.");
      await tx.insert(appointmentEvents).values({
        appointmentId: input.appointmentId,
        actorId: input.actorId,
        kind: "paid",
        note: "Paid in cash.",
      });
      return toPayment(row, []);
    });
  }

  async addRefund(input: {
    paymentId: string;
    amountCentavos: number;
    reason: string;
    actorId: string;
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, input.paymentId))
        .for("update");
      if (!current) throw new Error("The payment to refund no longer exists.");
      const status = statusAfterRefund(current, input.amountCentavos);
      await tx
        .update(payments)
        .set({ status, refundedCentavos: current.refundedCentavos + input.amountCentavos })
        .where(eq(payments.id, input.paymentId));
      await tx.insert(paymentRefunds).values({
        paymentId: input.paymentId,
        amountCentavos: input.amountCentavos,
        reason: input.reason,
        refundedBy: input.actorId,
      });
      await tx
        .update(appointments)
        .set({ paymentStatus: status })
        .where(eq(appointments.id, current.appointmentId));
      await tx.insert(appointmentEvents).values({
        appointmentId: current.appointmentId,
        actorId: input.actorId,
        kind: "refunded",
        note: input.reason,
      });
    });
  }

  async recordWebhookEvent(eventId: string): Promise<boolean> {
    const rows = await this.db
      .insert(paymentWebhookEvents)
      .values({ eventId })
      .onConflictDoNothing()
      .returning({ eventId: paymentWebhookEvents.eventId });
    return rows.length > 0;
  }

  /** Payments matching `where`, oldest first, with their refunds. */
  private async load(where: SQL): Promise<Payment[]> {
    const rows = await this.db
      .select()
      .from(payments)
      .where(where)
      .orderBy(asc(payments.createdAt));
    const refunds = await this.refundsOf(rows.map((row) => row.id));
    return rows.map((row) => toPayment(row, refunds));
  }

  /** Payments matching `where`, newest first, with their appointment and refunds. */
  private async loadWithAppointments(
    where: SQL | undefined,
    page: { page: number; pageSize: number } | null = null,
  ): Promise<PaymentWithAppointment[]> {
    const base = this.db
      .select({
        payment: payments,
        number: appointments.number,
        date: appointments.visitDate,
        status: appointments.status,
        patientId: appointments.patientUserId,
        patientName,
      })
      .from(payments)
      .innerJoin(appointments, eq(appointments.id, payments.appointmentId))
      .innerJoin(users, eq(users.id, appointments.patientUserId))
      .where(where)
      .orderBy(desc(sql`coalesce(${payments.paidAt}, ${payments.createdAt})`));
    const rows = page
      ? await base.limit(page.pageSize).offset((page.page - 1) * page.pageSize)
      : await base;
    const refunds = await this.refundsOf(rows.map((row) => row.payment.id));
    return rows.map((row) => ({
      ...toPayment(row.payment, refunds),
      appointment: {
        code: formatAppointmentCode(row.number),
        date: row.date,
        status: row.status,
        patientId: row.patientId,
        patientName: row.patientName,
      },
    }));
  }

  private async refundsOf(paymentIds: string[]) {
    if (paymentIds.length === 0) return [];
    return await this.db
      .select()
      .from(paymentRefunds)
      .where(inArray(paymentRefunds.paymentId, paymentIds))
      .orderBy(asc(paymentRefunds.createdAt));
  }
}

function toPayment(row: PaymentRow, refunds: (typeof paymentRefunds.$inferSelect)[]): Payment {
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    provider: row.provider,
    status: row.status,
    amountCentavos: row.amountCentavos,
    refundedCentavos: row.refundedCentavos,
    providerReference: row.providerReference,
    checkoutUrl: row.checkoutUrl,
    recordedBy: row.recordedBy,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    duplicate: row.duplicate,
    refunds: refunds
      .filter((refund) => refund.paymentId === row.id)
      .map((refund) => ({
        id: refund.id,
        amountCentavos: refund.amountCentavos,
        reason: refund.reason,
        refundedBy: refund.refundedBy,
        createdAt: refund.createdAt,
      })),
  };
}
