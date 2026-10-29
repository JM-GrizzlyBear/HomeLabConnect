import { and, asc, count, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { formatAppointmentCode } from "../../domain/appointments/appointment.js";
import type { TestResult } from "../../domain/results/result.js";
import type {
  ResultRepository,
  ReviewQueueItem,
  ReviewQueueTab,
} from "../../domain/results/ResultRepository.js";
import type { Database } from "./client.js";
import { likePattern } from "./likePattern.js";
import {
  appointmentEvents,
  appointmentProcedures,
  appointments,
  testResults,
  users,
} from "./schema/index.js";

const uploaderName = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;
const patientName = sql<string>`${users.firstName} || ' ' || ${users.lastName}`;

// Per collected visit: how many tests were collected, how many have a result, and when released
const testsCollected = sql<number>`(
  select count(*) from ${appointmentProcedures}
  where ${appointmentProcedures.appointmentId} = ${appointments.id}
    and ${appointmentProcedures.collected} = true
)`.mapWith(Number);
const testsWithResults = sql<number>`(
  select count(*) from ${testResults}
  where ${testResults.appointmentId} = ${appointments.id}
)`.mapWith(Number);
const releasedAt = sql<Date | null>`(
  select max(${testResults.releasedAt}) from ${testResults}
  where ${testResults.appointmentId} = ${appointments.id}
)`.mapWith((value) => (value ? new Date(value) : null));

const tabFilters: Record<ReviewQueueTab, SQL> = {
  to_upload: sql`${releasedAt} is null and ${testsWithResults} < ${testsCollected}`,
  ready_to_release: sql`${releasedAt} is null and ${testsWithResults} >= ${testsCollected}`,
  released: sql`${releasedAt} is not null`,
};

export class DrizzleResultRepository implements ResultRepository {
  constructor(private readonly db: Database) {}

  async listForAppointment(appointmentId: string): Promise<TestResult[]> {
    return await this.load(eq(testResults.appointmentId, appointmentId));
  }

  async findById(id: string): Promise<TestResult | null> {
    const [result] = await this.load(eq(testResults.id, id));
    return result ?? null;
  }

  async saveDraft(input: {
    appointmentId: string;
    procedureId: string;
    file: TestResult["file"];
    comment: string | null;
    uploadedBy: string;
  }): Promise<{ replacedStorageKey: string | null }> {
    return await this.db.transaction(async (tx) => {
      const [previous] = await tx
        .select({ storageKey: testResults.storageKey })
        .from(testResults)
        .where(
          and(
            eq(testResults.appointmentId, input.appointmentId),
            eq(testResults.procedureId, input.procedureId),
          ),
        )
        .for("update");
      const values = {
        filename: input.file.filename,
        mimeType: input.file.mimeType,
        sizeBytes: input.file.sizeBytes,
        storageKey: input.file.storageKey,
        comment: input.comment,
        uploadedBy: input.uploadedBy,
        uploadedAt: new Date(),
      };
      await tx
        .insert(testResults)
        .values({ appointmentId: input.appointmentId, procedureId: input.procedureId, ...values })
        .onConflictDoUpdate({
          target: [testResults.appointmentId, testResults.procedureId],
          set: values,
        });
      return { replacedStorageKey: previous?.storageKey ?? null };
    });
  }

  async deleteDraft(appointmentId: string, procedureId: string): Promise<string | null> {
    const [deleted] = await this.db
      .delete(testResults)
      .where(
        and(
          eq(testResults.appointmentId, appointmentId),
          eq(testResults.procedureId, procedureId),
          isNull(testResults.releasedAt),
        ),
      )
      .returning({ storageKey: testResults.storageKey });
    return deleted?.storageKey ?? null;
  }

  async release(appointmentId: string, actorId: string, at: Date): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(testResults)
        .set({ releasedAt: at, releasedBy: actorId })
        .where(and(eq(testResults.appointmentId, appointmentId), isNull(testResults.releasedAt)));
      await tx.insert(appointmentEvents).values({
        appointmentId,
        actorId,
        kind: "results_released",
        note: null,
      });
    });
  }

  async queue(query: {
    tab: ReviewQueueTab;
    q: string | null;
    page: number;
    pageSize: number;
  }): Promise<{ items: ReviewQueueItem[]; total: number }> {
    const filters: SQL[] = [eq(appointments.status, "collected"), tabFilters[query.tab]];
    if (query.q) {
      const number = Number(query.q.replace(/\D/g, ""));
      const matches: SQL[] = [ilike(patientName, likePattern(query.q))];
      if (Number.isInteger(number) && number > 0) matches.push(eq(appointments.number, number));
      filters.push(or(...matches) as SQL);
    }
    const where = and(...filters);
    const [{ total } = { total: 0 }] = await this.db
      .select({ total: count() })
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.patientUserId))
      .where(where);
    const rows = await this.selectItems()
      .where(where)
      .orderBy(desc(appointments.visitDate), desc(appointments.slotStart))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { items: rows.map(toItem), total };
  }

  async releasedForPatient(patientId: string): Promise<ReviewQueueItem[]> {
    const rows = await this.selectItems()
      .where(
        and(
          eq(appointments.patientUserId, patientId),
          eq(appointments.status, "collected"),
          tabFilters.released,
        ),
      )
      .orderBy(desc(appointments.visitDate), desc(appointments.slotStart));
    return rows.map(toItem);
  }

  private selectItems() {
    return this.db
      .select({
        appointmentId: appointments.id,
        number: appointments.number,
        patientName,
        date: appointments.visitDate,
        slot: appointments.slotStart,
        paymentStatus: appointments.paymentStatus,
        testsCollected,
        testsWithResults,
        releasedAt,
      })
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.patientUserId))
      .$dynamic();
  }

  private async load(where: SQL): Promise<TestResult[]> {
    const rows = await this.db
      .select({ result: testResults, uploaderName })
      .from(testResults)
      .innerJoin(users, eq(users.id, testResults.uploadedBy))
      .where(where)
      .orderBy(asc(testResults.uploadedAt));
    return rows.map(({ result, uploaderName: name }) => ({
      id: result.id,
      appointmentId: result.appointmentId,
      procedureId: result.procedureId,
      file: {
        filename: result.filename,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes,
        storageKey: result.storageKey,
      },
      comment: result.comment,
      uploadedBy: { id: result.uploadedBy, name },
      uploadedAt: result.uploadedAt,
      releasedAt: result.releasedAt,
    }));
  }
}

function toItem({
  number,
  ...row
}: Omit<ReviewQueueItem, "code"> & { number: number }): ReviewQueueItem {
  return { ...row, code: formatAppointmentCode(number) };
}
