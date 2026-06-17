import { eq } from "drizzle-orm";
import type {
  CreateRoleInput,
  PublicRole,
  Role,
  UpdateRoleInput,
} from "@homelabconnect/shared";
import type { RoleRepository } from "../../../application/ports/role-repository";
import type { Db } from "../client";
import { type RoleRow, roles } from "../schema";

function rowToPublic(row: RoleRow): PublicRole {
  return {
    id: row.id,
    role: row.role,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class DrizzleRoleRepository implements RoleRepository {
  constructor(private readonly db: Db) {}

  async list(): Promise<PublicRole[]> {
    const rows = await this.db.query.roles.findMany();
    return rows.map(rowToPublic);
  }

  async findById(id: string): Promise<PublicRole | null> {
    const row = await this.db.query.roles.findFirst({
      where: eq(roles.id, id),
    });
    return row ? rowToPublic(row) : null;
  }

  async findByRole(role: Role): Promise<PublicRole | null> {
    const row = await this.db.query.roles.findFirst({
      where: eq(roles.role, role),
    });
    return row ? rowToPublic(row) : null;
  }

  async create(data: CreateRoleInput): Promise<PublicRole> {
    const [row] = await this.db
      .insert(roles)
      .values({ role: data.role, description: data.description })
      .returning();
    if (!row) throw new Error("INSERT roles returned no row");
    return rowToPublic(row);
  }

  async update(data: UpdateRoleInput): Promise<PublicRole> {
    const [row] = await this.db
      .update(roles)
      .set({ description: data.description, updatedAt: new Date() })
      .where(eq(roles.id, data.id))
      .returning();
    if (!row) throw new Error("UPDATE roles returned no row");
    return rowToPublic(row);
  }
}
