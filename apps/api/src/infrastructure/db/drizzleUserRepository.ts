import { eq } from "drizzle-orm";
import type { NewPatientAccount, UserRepository } from "../../application/ports/userRepository.js";
import { isBaseRole } from "../../domain/identity/baseRole.js";
import { EmailAlreadyTaken } from "../../domain/identity/identityErrors.js";
import { User } from "../../domain/identity/user.js";
import type { Database } from "./client.js";
import { isUniqueViolation } from "./errors.js";
import { patients, users } from "./schema/index.js";

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
    isActive: row.isActive,
  });
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

  async recordSignIn(userId: string, at: Date): Promise<void> {
    await this.db.update(users).set({ lastLoginAt: at }).where(eq(users.id, userId));
  }
}
