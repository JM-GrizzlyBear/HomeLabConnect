import type {
  CreateRoleInput,
  PublicRole,
  Role,
  UpdateRoleInput,
} from "@homelabconnect/shared";

export interface RoleRepository {
  list(): Promise<PublicRole[]>;
  findById(id: string): Promise<PublicRole | null>;
  findByRole(role: Role): Promise<PublicRole | null>;
  create(data: CreateRoleInput): Promise<PublicRole>;
  update(data: UpdateRoleInput): Promise<PublicRole>;
}
