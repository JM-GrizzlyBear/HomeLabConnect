import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type {
  NewPatientAccount,
  NewStaffAccount,
  UserListItem,
  UserListPage,
  UserListQuery,
  UserProfile,
  UserRepository,
} from "../../domain/identity/UserRepository.js";
import { isBaseRole } from "../../domain/identity/baseRole.js";
import { EmailAlreadyTaken } from "../../domain/identity/identityErrors.js";
import type { ProfileChanges } from "../../domain/identity/profile.js";
import { User } from "../../domain/identity/user.js";
import type { Database } from "./client.js";
import { isUniqueViolation } from "./errors.js";
import { likePattern } from "./likePattern.js";
import { customRoles, employees, patients, users } from "./schema/index.js";
import type { StoredPhoto } from "../../domain/media/photo.js";

type UserRow = typeof users.$inferSelect;

function toUser(row: UserRow): User {
  if (!isBaseRole(row.roleId)) throw new Error(`User ${row.id} has unknown role "${row.roleId}".`);
  return User.restore({
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.roleId,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    mustChangePassword: row.mustChangePassword,
    temporaryPasswordExpiresAt: row.temporaryPasswordExpiresAt,
    customRoleId: row.customRoleId,
    isActive: row.isActive,
    photoUrl: row.photoUrl,
    photoStorageKey: row.photoStorageKey,
  });
}

interface ListRow {
  user: UserRow;
  customRole: { id: string; name: string } | null;
}

function toListItem({ user, customRole }: ListRow): UserListItem {
  return {
    user: toUser(user),
    customRole,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

function listFilter({ search, role, isActive }: UserListQuery): SQL | undefined {
  const pattern = search ? likePattern(search) : null;
  return and(
    pattern
      ? or(
          ilike(users.email, pattern),
          ilike(users.firstName, pattern),
          ilike(users.lastName, pattern),
        )
      : undefined,
    role ? eq(users.roleId, role) : undefined,
    isActive === null ? undefined : eq(users.isActive, isActive),
  );
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email));
    return row ? toUser(row) : null;
  }

  async findProfile(id: string): Promise<UserProfile | null> {
    const [row] = await this.db
      .select({ user: users, patient: patients })
      .from(users)
      .leftJoin(patients, eq(patients.userId, users.id))
      .where(eq(users.id, id));
    if (!row) return null;
    const user = toUser(row.user);
    const patient =
      user.role === "patient"
        ? { birthDate: row.patient?.birthDate ?? null, address: row.patient?.address ?? null }
        : null;
    return { user, patient };
  }

  async list(query: UserListQuery): Promise<UserListPage> {
    const where = listFilter(query);
    const [rows, [totals]] = await Promise.all([
      this.listSelect()
        .where(where)
        .orderBy(desc(users.createdAt), users.email)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ total: count() }).from(users).where(where),
    ]);
    return { items: rows.map(toListItem), total: totals?.total ?? 0 };
  }

  async findListItem(id: string): Promise<UserListItem | null> {
    const [row] = await this.listSelect().where(eq(users.id, id));
    return row ? toListItem(row) : null;
  }

  /** Users with their custom role's name, for the admin list. */
  private listSelect() {
    return this.db
      .select({ user: users, customRole: { id: customRoles.id, name: customRoles.name } })
      .from(users)
      .leftJoin(customRoles, eq(customRoles.id, users.customRoleId));
  }

  async createPatientAccount(account: NewPatientAccount): Promise<User> {
    try {
      return await this.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(users)
          .values({
            email: account.email,
            passwordHash: account.passwordHash,
            roleId: "patient",
            firstName: account.firstName,
            lastName: account.lastName,
            phone: account.phone,
          })
          .returning();
        if (!row) throw new Error("Insert into users returned no row.");
        await tx
          .insert(patients)
          .values({ userId: row.id, birthDate: account.birthDate, address: account.address });
        return toUser(row);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailAlreadyTaken();
      throw error;
    }
  }

  async createStaffAccount(account: NewStaffAccount): Promise<User> {
    try {
      return await this.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(users)
          .values({
            email: account.email,
            passwordHash: account.passwordHash,
            roleId: account.role,
            firstName: account.firstName,
            lastName: account.lastName,
            phone: account.phone,
            mustChangePassword: true,
            temporaryPasswordExpiresAt: account.temporaryPasswordExpiresAt,
            customRoleId: account.customRoleId,
          })
          .returning();
        if (!row) throw new Error("Insert into users returned no row.");
        await tx.insert(employees).values({ userId: row.id, hiredOn: account.hiredOn });
        return toUser(row);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailAlreadyTaken();
      throw error;
    }
  }

  async recordSignIn(userId: string, at: Date): Promise<void> {
    await this.db.update(users).set({ lastLoginAt: at }).where(eq(users.id, userId));
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash, mustChangePassword: false, temporaryPasswordExpiresAt: null })
      .where(eq(users.id, userId));
  }

  async setTemporaryPassword(userId: string, passwordHash: string, expiresAt: Date): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash, mustChangePassword: true, temporaryPasswordExpiresAt: expiresAt })
      .where(eq(users.id, userId));
  }

  async setActive(userId: string, isActive: boolean): Promise<void> {
    await this.db.update(users).set({ isActive }).where(eq(users.id, userId));
  }

  async setCustomRole(userId: string, customRoleId: string | null): Promise<void> {
    await this.db.update(users).set({ customRoleId }).where(eq(users.id, userId));
  }

  async setPhoto(userId: string, photo: StoredPhoto | null): Promise<void> {
    await this.db
      .update(users)
      .set({ photoUrl: photo?.url ?? null, photoStorageKey: photo?.storageKey ?? null })
      .where(eq(users.id, userId));
  }

  async updateProfile(userId: string, changes: ProfileChanges): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ firstName: changes.firstName, lastName: changes.lastName, phone: changes.phone })
        .where(eq(users.id, userId));
      if (changes.patient) {
        // Upsert, in case a patient row was never created (e.g. seeded data).
        await tx
          .insert(patients)
          .values({ userId, ...changes.patient })
          .onConflictDoUpdate({ target: patients.userId, set: changes.patient });
      }
    });
  }
}
