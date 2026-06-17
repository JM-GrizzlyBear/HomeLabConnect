import { eq } from "drizzle-orm";
import type {
  CreateUserData,
  UserRepository,
} from "../../../application/ports/user-repository";
import type { User } from "../../../domain/entities/user";
import type { Db } from "../client";
import { type UserRow, users } from "../schema";

function rowToEntity(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    firstName: row.firstName,
    lastName: row.lastName,
    middleName: row.middleName,
    phone: row.phone,
    avatar: row.avatar,
    isActive: row.isActive,
    emailVerified: row.emailVerified,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return row ? rowToEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return row ? rowToEntity(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        phone: data.phone,
        avatar: data.avatar,
      })
      .returning();
    if (!row) throw new Error("INSERT users returned no row");
    return rowToEntity(row);
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }
}
