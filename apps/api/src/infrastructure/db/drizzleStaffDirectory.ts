import { and, asc, eq, ne } from "drizzle-orm";
import type { StaffDirectory, StaffMember } from "../../application/ports/staffDirectory.js";
import { type BaseRole, isBaseRole } from "../../domain/identity/baseRole.js";
import type { Database } from "./client.js";
import { users } from "./schema/index.js";

export class DrizzleStaffDirectory implements StaffDirectory {
  constructor(private readonly db: Database) {}

  async listActive(role: BaseRole | null): Promise<StaffMember[]> {
    const rows = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.roleId,
      })
      .from(users)
      .where(
        and(eq(users.isActive, true), role ? eq(users.roleId, role) : ne(users.roleId, "patient")),
      )
      .orderBy(asc(users.lastName), asc(users.firstName));
    return rows.flatMap((row) => (isBaseRole(row.role) ? [{ ...row, role: row.role }] : []));
  }
}
