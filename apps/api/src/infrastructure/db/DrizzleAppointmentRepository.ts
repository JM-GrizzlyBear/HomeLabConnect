import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  ACTIVE_STATUSES,
  type Appointment,
  type AppointmentEventKind,
  formatAppointmentCode,
} from "../../domain/appointments/appointment.js";
import { SlotFull } from "../../domain/appointments/appointmentErrors.js";
import type {
  AppointmentListPage,
  AppointmentListQuery,
  AppointmentRepository,
  NewAppointment,
  SlotLimits,
  StatusChange,
} from "../../domain/appointments/AppointmentRepository.js";
import type { DayBookings } from "../../domain/appointments/availability.js";
import type { Database } from "./client.js";
import { likePattern } from "./likePattern.js";
import {
  appointmentEvents,
  appointmentProcedures,
  appointments,
  rescheduleProposals,
  users,
} from "./schema/index.js";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const activeStatus = inArray(appointments.status, [...ACTIVE_STATUSES]);
const patientName = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;

export class DrizzleAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: Database) {}

  async bookingsBetween(from: string, to: string): Promise<Map<string, DayBookings>> {
    const rows = await this.db
      .select({ date: appointments.visitDate, slot: appointments.slotStart, count: count() })
      .from(appointments)
      .where(and(gte(appointments.visitDate, from), lte(appointments.visitDate, to), activeStatus))
      .groupBy(appointments.visitDate, appointments.slotStart);

    const days = new Map<string, { bySlot: Map<string, number>; total: number }>();
    for (const row of rows) {
      const day = days.get(row.date) ?? { bySlot: new Map(), total: 0 };
      day.bySlot.set(row.slot, row.count);
      day.total += row.count;
      days.set(row.date, day);
    }
    return days;
  }

  async book(input: NewAppointment, limits: SlotLimits, actorId: string): Promise<Appointment> {
    const id = await this.db.transaction(async (tx) => {
      await assertRoom(tx, input.date, input.slot, limits, null);
      const subtotal = input.lines.reduce((sum, line) => sum + line.priceCentavos, 0);
      const discount = input.lines.reduce((sum, line) => sum + line.discountCentavos, 0);
      const [row] = await tx
        .insert(appointments)
        .values({
          patientUserId: input.patientId,
          visitDate: input.date,
          slotStart: input.slot,
          status: input.status,
          address: input.address,
          landmark: input.landmark,
          patientNotes: input.notes,
          subtotalCentavos: subtotal,
          discountCentavos: discount,
          totalCentavos: subtotal - discount,
        })
        .returning({ id: appointments.id });
      if (!row) throw new Error("Insert into appointments returned no row.");
      await tx.insert(appointmentProcedures).values(
        input.lines.map((line, position) => ({
          appointmentId: row.id,
          procedureId: line.procedureId,
          position,
          code: line.code,
          name: line.name,
          priceCentavos: line.priceCentavos,
          promotionId: line.promotionId,
          promotionName: line.promotionName,
          discountCentavos: line.discountCentavos,
        })),
      );
      await addEvent(tx, row.id, actorId, "booked", null);
      if (input.status === "confirmed")
        await addEvent(tx, row.id, null, "confirmed", "Confirmed automatically.");
      return row.id;
    });
    const booked = await this.findById(id);
    if (!booked) throw new Error("The new appointment could not be read back.");
    return booked;
  }

  async findById(id: string): Promise<Appointment | null> {
    const [appointment] = await this.load(eq(appointments.id, id));
    return appointment ?? null;
  }

  async listForPatient(patientId: string): Promise<Appointment[]> {
    return await this.load(eq(appointments.patientUserId, patientId), [
      desc(appointments.visitDate),
      desc(appointments.slotStart),
    ]);
  }

  async list(query: AppointmentListQuery): Promise<AppointmentListPage> {
    const filters: SQL[] = [];
    if (query.status) filters.push(eq(appointments.status, query.status));
    if (query.from) filters.push(gte(appointments.visitDate, query.from));
    if (query.to) filters.push(lte(appointments.visitDate, query.to));
    if (query.q) {
      const pattern = likePattern(query.q);
      const number = Number(query.q.replace(/\D/g, ""));
      const matches: SQL[] = [ilike(patientName, pattern)];
      if (Number.isInteger(number) && number > 0) matches.push(eq(appointments.number, number));
      filters.push(or(...matches) as SQL);
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [{ total } = { total: 0 }] = await this.db
      .select({ total: count() })
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.patientUserId))
      .where(where);
    const items = await this.load(
      where,
      [
        // Waiting for review first, then by visit time
        sql`${appointments.status} <> 'pending'`,
        asc(appointments.visitDate),
        asc(appointments.slotStart),
      ],
      { limit: query.pageSize, offset: (query.page - 1) * query.pageSize },
    );
    return { items, total };
  }

  async changeStatus(id: string, change: StatusChange): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(appointments)
        .set({
          status: change.status,
          ...(change.decisionNote !== undefined ? { decisionNote: change.decisionNote } : {}),
        })
        .where(eq(appointments.id, id));
      // Whatever was proposed no longer applies
      await tx
        .update(rescheduleProposals)
        .set({ status: "withdrawn" })
        .where(
          and(eq(rescheduleProposals.appointmentId, id), eq(rescheduleProposals.status, "open")),
        );
      await addEvent(tx, id, change.actorId, change.event, change.note);
    });
  }

  async proposeTime(
    id: string,
    proposal: { date: string; slot: string; reason: string },
    actorId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(rescheduleProposals)
        .set({ status: "withdrawn" })
        .where(
          and(eq(rescheduleProposals.appointmentId, id), eq(rescheduleProposals.status, "open")),
        );
      await tx.insert(rescheduleProposals).values({
        appointmentId: id,
        proposedDate: proposal.date,
        proposedSlot: proposal.slot,
        reason: proposal.reason,
        proposedBy: actorId,
      });
      await tx
        .update(appointments)
        .set({ status: "reschedule_proposed" })
        .where(eq(appointments.id, id));
      await addEvent(
        tx,
        id,
        actorId,
        "reschedule_proposed",
        `${proposal.date} ${proposal.slot}: ${proposal.reason}`,
      );
    });
  }

  async acceptProposal(id: string, limits: SlotLimits, actorId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [proposal] = await openProposal(tx, id);
      if (!proposal) return;
      await assertRoom(tx, proposal.proposedDate, proposal.proposedSlot, limits, id);
      await tx
        .update(appointments)
        .set({
          visitDate: proposal.proposedDate,
          slotStart: proposal.proposedSlot,
          status: "confirmed",
        })
        .where(eq(appointments.id, id));
      await tx
        .update(rescheduleProposals)
        .set({ status: "accepted" })
        .where(eq(rescheduleProposals.id, proposal.id));
      await addEvent(tx, id, actorId, "reschedule_accepted", null);
    });
  }

  async declineProposal(id: string, actorId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [proposal] = await openProposal(tx, id);
      if (proposal) {
        await tx
          .update(rescheduleProposals)
          .set({ status: "declined" })
          .where(eq(rescheduleProposals.id, proposal.id));
      }
      await tx.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, id));
      await addEvent(tx, id, actorId, "reschedule_declined", null);
    });
  }

  /** Appointments matching `where`, with their tests, open proposal and history. */
  private async load(
    where: SQL | undefined,
    orderBy: SQL[] = [desc(appointments.visitDate)],
    page?: { limit: number; offset: number },
  ): Promise<Appointment[]> {
    const base = this.db
      .select({
        id: appointments.id,
        number: appointments.number,
        patientId: appointments.patientUserId,
        patientName,
        patientEmail: users.email,
        patientPhone: users.phone,
        date: appointments.visitDate,
        slot: appointments.slotStart,
        status: appointments.status,
        address: appointments.address,
        landmark: appointments.landmark,
        notes: appointments.patientNotes,
        subtotalCentavos: appointments.subtotalCentavos,
        discountCentavos: appointments.discountCentavos,
        totalCentavos: appointments.totalCentavos,
        paymentStatus: appointments.paymentStatus,
        decisionNote: appointments.decisionNote,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.patientUserId))
      .where(where)
      .orderBy(...orderBy);
    const rows = page ? await base.limit(page.limit).offset(page.offset) : await base;
    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);
    const [lines, proposals, events] = await Promise.all([
      this.db
        .select()
        .from(appointmentProcedures)
        .where(inArray(appointmentProcedures.appointmentId, ids))
        .orderBy(asc(appointmentProcedures.position)),
      this.db
        .select()
        .from(rescheduleProposals)
        .where(
          and(
            inArray(rescheduleProposals.appointmentId, ids),
            eq(rescheduleProposals.status, "open"),
          ),
        ),
      this.db
        .select({
          appointmentId: appointmentEvents.appointmentId,
          at: appointmentEvents.at,
          kind: appointmentEvents.kind,
          note: appointmentEvents.note,
          actorName: sql<string | null>`${users.firstName} || ' ' || ${users.lastName}`,
        })
        .from(appointmentEvents)
        .leftJoin(users, eq(users.id, appointmentEvents.actorId))
        .where(inArray(appointmentEvents.appointmentId, ids))
        .orderBy(asc(appointmentEvents.at)),
    ]);

    return rows.map(({ number, ...row }) => {
      const proposal = proposals.find((candidate) => candidate.appointmentId === row.id);
      return {
        ...row,
        code: formatAppointmentCode(number),
        lines: lines
          .filter((line) => line.appointmentId === row.id)
          .map((line) => ({
            procedureId: line.procedureId,
            code: line.code,
            name: line.name,
            priceCentavos: line.priceCentavos,
            promotionId: line.promotionId,
            promotionName: line.promotionName,
            discountCentavos: line.discountCentavos,
          })),
        openProposal: proposal
          ? {
              id: proposal.id,
              date: proposal.proposedDate,
              slot: proposal.proposedSlot,
              reason: proposal.reason,
              proposedBy: proposal.proposedBy,
            }
          : null,
        events: events
          .filter((event) => event.appointmentId === row.id)
          .map((event) => ({
            at: event.at,
            actorName: event.actorName,
            kind: event.kind as AppointmentEventKind,
            note: event.note,
          })),
      };
    });
  }
}

/**
 * Locks the date (until the transaction ends) and checks the slot and the day still have room,
 * leaving out `exceptId` (an appointment moving to this slot). Throws SlotFull otherwise.
 */
async function assertRoom(
  tx: Transaction,
  date: string,
  slot: string,
  limits: SlotLimits,
  exceptId: string | null,
): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`appointments:${date}`}))`);
  const others = exceptId ? ne(appointments.id, exceptId) : undefined;
  const [day] = await tx
    .select({
      total: count(),
      inSlot: sql<number>`count(*) filter (where ${appointments.slotStart} = ${slot})`.mapWith(
        Number,
      ),
    })
    .from(appointments)
    .where(and(eq(appointments.visitDate, date), activeStatus, others));
  if ((day?.inSlot ?? 0) >= limits.perSlot || (day?.total ?? 0) >= limits.perDay) {
    throw new SlotFull();
  }
}

async function openProposal(tx: Transaction, appointmentId: string) {
  return await tx
    .select()
    .from(rescheduleProposals)
    .where(
      and(
        eq(rescheduleProposals.appointmentId, appointmentId),
        eq(rescheduleProposals.status, "open"),
      ),
    );
}

async function addEvent(
  tx: Transaction,
  appointmentId: string,
  actorId: string | null,
  kind: AppointmentEventKind,
  note: string | null,
): Promise<void> {
  await tx.insert(appointmentEvents).values({ appointmentId, actorId, kind, note });
}
