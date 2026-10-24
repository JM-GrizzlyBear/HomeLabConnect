// Arranges data for integration tests straight in the test database.
// Each helper fills sensible defaults, like the in-memory fakes' add() did.
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import type { PermissionEntry } from "../../../src/domain/access/resolveAccess.js";
import type { LabProcedureDetails } from "../../../src/domain/catalog/labProcedure.js";
import type { PromotionDetails } from "../../../src/domain/catalog/promotion.js";
import type { BaseRole } from "../../../src/domain/identity/baseRole.js";
import type { Roster } from "../../../src/domain/scheduling/roster.js";
import type { ClosedDayDetails } from "../../../src/domain/settings/closedDay.js";
import type { Database } from "../../../src/infrastructure/db/client.js";
import { DrizzleLabProcedureRepository } from "../../../src/infrastructure/db/DrizzleLabProcedureRepository.js";
import { DrizzleMedTeamRepository } from "../../../src/infrastructure/db/DrizzleMedTeamRepository.js";
import { DrizzleProcedureCategoryRepository } from "../../../src/infrastructure/db/DrizzleProcedureCategoryRepository.js";
import { DrizzlePromotionRepository } from "../../../src/infrastructure/db/DrizzlePromotionRepository.js";
import { DrizzleRoleRepository } from "../../../src/infrastructure/db/DrizzleRoleRepository.js";
import { DrizzleShiftRepository } from "../../../src/infrastructure/db/DrizzleShiftRepository.js";
import {
  employees,
  holidays,
  labProcedures,
  patients,
  users,
} from "../../../src/infrastructure/db/schema/index.js";

export const PASSWORD = "Password123";
// Hashed once, with 4 rounds: fast, fine for tests
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

export interface GivenUser {
  id?: string;
  email: string;
  role?: BaseRole;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  password?: string;
  mustChangePassword?: boolean;
  temporaryPasswordExpiresAt?: Date | null;
  customRoleId?: string | null;
  isActive?: boolean;
}

export class Given {
  constructor(private readonly db: Database) {}

  /** A user (patient by default) who signs in with "Password123" unless `password` is given. */
  async user({ role = "patient", password, ...details }: GivenUser) {
    const [row] = await this.db
      .insert(users)
      .values({
        firstName: "Test",
        lastName: "User",
        ...details,
        email: details.email.toLowerCase(),
        roleId: role,
        passwordHash: password ? bcrypt.hashSync(password, 4) : PASSWORD_HASH,
      })
      .returning();
    if (!row) throw new Error("Insert into users returned no row.");
    if (role === "patient") await this.db.insert(patients).values({ userId: row.id });
    else await this.db.insert(employees).values({ userId: row.id });
    return { ...row, role };
  }

  async customRole(role: {
    name: string;
    baseRole: BaseRole;
    description?: string | null;
    entries?: PermissionEntry[];
  }) {
    return await new DrizzleRoleRepository(this.db).createCustomRole({
      description: null,
      entries: [],
      ...role,
    });
  }

  async assignCustomRole(userId: string, customRoleId: string | null): Promise<void> {
    await this.db.update(users).set({ customRoleId }).where(eq(users.id, userId));
  }

  async category(name: string) {
    return await new DrizzleProcedureCategoryRepository(this.db).create(name);
  }

  /** A blood test priced ₱350 unless told otherwise. */
  async procedure(
    procedure: Partial<LabProcedureDetails> & {
      code: string;
      categoryId: string;
      isActive?: boolean;
    },
  ) {
    const { isActive = true, ...details } = procedure;
    const created = await new DrizzleLabProcedureRepository(this.db).create({
      name: details.code,
      priceCentavos: 35_000,
      specimen: "blood",
      turnaroundHours: 24,
      fastingHours: 0,
      preparation: null,
      description: null,
      ...details,
    });
    if (!isActive) {
      await this.db.update(labProcedures).set({ isActive }).where(eq(labProcedures.id, created.id));
    }
    return { ...created, isActive };
  }

  /** 20% off everything in January 2026 unless told otherwise. */
  async promotion(promotion: Partial<PromotionDetails> & { name: string; isActive?: boolean }) {
    const { isActive = true, ...details } = promotion;
    const repository = new DrizzlePromotionRepository(this.db);
    const created = await repository.create({
      description: null,
      discountType: "percent",
      value: 20,
      startsOn: "2026-01-01",
      endsOn: "2026-01-31",
      appliesTo: "all",
      procedureIds: [],
      ...details,
    });
    if (!isActive) await repository.setActive(created.id, false);
    return { ...created, isActive };
  }

  async closedDay(details: Partial<ClosedDayDetails> & { date: string }) {
    const [row] = await this.db
      .insert(holidays)
      .values({ name: "Closed", kind: "holiday", repeatsYearly: false, ...details })
      .returning({
        id: holidays.id,
        date: holidays.date,
        name: holidays.name,
        kind: holidays.kind,
        repeatsYearly: holidays.repeatsYearly,
      });
    if (!row) throw new Error("Insert into holidays returned no row.");
    return row;
  }

  async team(team: { name: string; area?: string | null; isActive?: boolean }) {
    const { isActive = true, ...details } = team;
    const repository = new DrizzleMedTeamRepository(this.db);
    const created = await repository.create({ area: null, ...details });
    if (!isActive) await repository.setActive(created.id, false);
    return { ...created, isActive };
  }

  async roster(roster: Roster): Promise<void> {
    await new DrizzleMedTeamRepository(this.db).saveRoster(roster);
  }

  /** Working days, 6:00 AM – 2:00 PM unless told otherwise. */
  async shifts(userId: string, dates: readonly string[], start = "06:00", end = "14:00") {
    await new DrizzleShiftRepository(this.db).setDays(userId, dates, { start, end });
  }
}
