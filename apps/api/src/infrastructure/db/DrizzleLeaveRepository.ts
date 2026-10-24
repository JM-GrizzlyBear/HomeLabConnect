import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { LeaveRepository, NewLeaveRequest } from "../../application/ports/leaveRepository.js";
import type { LeaveRequest, LeaveStatus } from "../../domain/scheduling/leave.js";
import type { LeaveDays } from "../../domain/scheduling/shift.js";
import type { Database } from "./client.js";
import { leaveDecisions, leaveRequests } from "./schema/index.js";

type RequestRow = typeof leaveRequests.$inferSelect;

export class DrizzleLeaveRepository implements LeaveRepository {
  constructor(private readonly db: Database) {}

  async create(request: NewLeaveRequest): Promise<LeaveRequest> {
    const [row] = await this.db.insert(leaveRequests).values(request).returning();
    if (!row) throw new Error("Insert into leave_requests returned no row.");
    return this.toRequest(row, []);
  }

  async findById(id: string): Promise<LeaveRequest | null> {
    const rows = await this.db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    const [request] = await this.withDecisions(rows);
    return request ?? null;
  }

  async listForUser(userId: string): Promise<LeaveRequest[]> {
    const rows = await this.db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.createdAt));
    return this.withDecisions(rows);
  }

  async list(status: LeaveStatus | null): Promise<LeaveRequest[]> {
    const rows = await this.db
      .select()
      .from(leaveRequests)
      .where(status ? eq(leaveRequests.status, status) : undefined)
      .orderBy(desc(leaveRequests.createdAt));
    return this.withDecisions(rows);
  }

  async update(request: LeaveRequest): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(leaveRequests)
        .set({ status: request.status, currentStep: request.currentStep })
        .where(eq(leaveRequests.id, request.id));
      // Decisions are only ever added; insert the ones not stored yet.
      if (request.decisions.length === 0) return;
      await tx
        .insert(leaveDecisions)
        .values(request.decisions.map((decision) => ({ requestId: request.id, ...decision })))
        .onConflictDoNothing();
    });
  }

  async approvedDays(
    userIds: readonly string[],
    from: string,
    to: string,
  ): Promise<Map<string, LeaveDays[]>> {
    const grouped = new Map<string, LeaveDays[]>(userIds.map((id) => [id, []]));
    if (userIds.length === 0) return grouped;
    const rows = await this.db
      .select({
        userId: leaveRequests.userId,
        startsOn: leaveRequests.startsOn,
        endsOn: leaveRequests.endsOn,
      })
      .from(leaveRequests)
      .where(
        and(
          inArray(leaveRequests.userId, [...userIds]),
          eq(leaveRequests.status, "approved"),
          lte(leaveRequests.startsOn, to),
          gte(leaveRequests.endsOn, from),
        ),
      );
    for (const row of rows) {
      grouped.get(row.userId)?.push({ startsOn: row.startsOn, endsOn: row.endsOn });
    }
    return grouped;
  }

  private toRequest(
    row: RequestRow,
    decisions: (typeof leaveDecisions.$inferSelect)[],
  ): LeaveRequest {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      startsOn: row.startsOn,
      endsOn: row.endsOn,
      reason: row.reason,
      status: row.status,
      chain: row.chain,
      currentStep: row.currentStep,
      teamLeadId: row.teamLeadId,
      decisions: decisions.map((decision) => ({
        step: decision.step,
        approverId: decision.approverId,
        decision: decision.decision,
        note: decision.note,
        decidedAt: decision.decidedAt,
      })),
    };
  }

  /** Adds each request's decisions, in one query. */
  private async withDecisions(rows: RequestRow[]): Promise<LeaveRequest[]> {
    if (rows.length === 0) return [];
    const decisions = await this.db
      .select()
      .from(leaveDecisions)
      .where(
        inArray(
          leaveDecisions.requestId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(leaveDecisions.step));
    return rows.map((row) =>
      this.toRequest(
        row,
        decisions.filter((decision) => decision.requestId === row.id),
      ),
    );
  }
}
