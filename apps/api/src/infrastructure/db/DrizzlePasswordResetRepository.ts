import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type {
  PasswordReset,
  PasswordResetRepository,
} from "../../domain/identity/PasswordResetRepository.js";
import type { Database } from "./client.js";
import { passwordResets } from "./schema/index.js";

const hashOf = (token: string) => createHash("sha256").update(token).digest("hex");

export class DrizzlePasswordResetRepository implements PasswordResetRepository {
  constructor(private readonly db: Database) {}

  async create({ userId, token, expiresAt }: { userId: string; token: string; expiresAt: Date }) {
    await this.db.insert(passwordResets).values({ userId, tokenHash: hashOf(token), expiresAt });
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
    const [row] = await this.db
      .select({
        id: passwordResets.id,
        userId: passwordResets.userId,
        expiresAt: passwordResets.expiresAt,
        usedAt: passwordResets.usedAt,
      })
      .from(passwordResets)
      .where(eq(passwordResets.tokenHash, hashOf(token)));
    return row ?? null;
  }

  async markUsed(id: string, at: Date): Promise<boolean> {
    const rows = await this.db
      .update(passwordResets)
      .set({ usedAt: at })
      .where(and(eq(passwordResets.id, id), isNull(passwordResets.usedAt)))
      .returning({ id: passwordResets.id });
    return rows.length > 0;
  }
}
