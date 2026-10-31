import { eq } from "drizzle-orm";
import type { OverrideRepository } from "../../domain/access/OverrideRepository.js";
import type { PermissionOverride } from "../../domain/access/resolveAccess.js";
import type { Database } from "./client.js";
import { userPermissionOverrides } from "./schema/index.js";

export class DrizzleOverrideRepository implements OverrideRepository {
  constructor(private readonly db: Database) {}

  async list(userId: string): Promise<PermissionOverride[]> {
    return await this.db
      .select({
        key: userPermissionOverrides.permissionId,
        effect: userPermissionOverrides.effect,
        expiresAt: userPermissionOverrides.expiresAt,
      })
      .from(userPermissionOverrides)
      .where(eq(userPermissionOverrides.userId, userId));
  }

  async replace(
    userId: string,
    overrides: readonly PermissionOverride[],
    grantedBy: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(userPermissionOverrides).where(eq(userPermissionOverrides.userId, userId));
      if (overrides.length === 0) return;
      await tx.insert(userPermissionOverrides).values(
        overrides.map((override) => ({
          userId,
          permissionId: override.key,
          effect: override.effect,
          expiresAt: override.expiresAt,
          grantedBy,
        })),
      );
    });
  }
}
