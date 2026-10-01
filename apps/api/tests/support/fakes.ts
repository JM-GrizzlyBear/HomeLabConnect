// In-memory stand-ins for the ports, for unit and route tests. Not part of the build.
import { randomUUID } from "node:crypto";
import { defaultBaseGrants, PERMISSION_KEYS } from "@homelabconnect/shared";
import type { AccessRepository } from "../../src/application/ports/accessRepository.js";
import type {
  BaseRoleRecord,
  CustomRoleChanges,
  CustomRoleRecord,
  NewCustomRole,
  RoleRepository,
} from "../../src/application/ports/roleRepository.js";
import { CustomRoleNameTaken } from "../../src/domain/access/accessErrors.js";
import type { CustomRole } from "../../src/domain/access/customRole.js";
import type {
  AccountEmails,
  TemporaryPasswordEmail,
} from "../../src/application/ports/accountEmails.js";
import type { Clock } from "../../src/application/ports/clock.js";
import type { PasswordHasher } from "../../src/application/ports/passwordHasher.js";
import type {
  NewSession,
  SessionRepository,
} from "../../src/application/ports/sessionRepository.js";
import type { TemporaryPasswordGenerator } from "../../src/application/ports/temporaryPasswordGenerator.js";
import type { AccessTokenClaims, TokenService } from "../../src/application/ports/tokenService.js";
import type {
  NewPatientAccount,
  NewStaffAccount,
  UserListItem,
  UserListPage,
  UserListQuery,
  UserProfile,
  UserRepository,
} from "../../src/application/ports/userRepository.js";
import type {
  AccessData,
  PermissionEntry,
  PermissionOverride,
} from "../../src/domain/access/resolveAccess.js";
import type { BaseRole } from "../../src/domain/identity/baseRole.js";
import { EmailAlreadyTaken } from "../../src/domain/identity/identityErrors.js";
import type { PatientDetails, ProfileChanges } from "../../src/domain/identity/profile.js";
import type { Session } from "../../src/domain/identity/session.js";
import { User, type UserProps } from "../../src/domain/identity/user.js";
import type {
  LabProcedureListPage,
  LabProcedureListQuery,
  LabProcedureRecord,
  LabProcedureRepository,
} from "../../src/application/ports/labProcedureRepository.js";
import type {
  ProcedureCategoryRecord,
  ProcedureCategoryRepository,
} from "../../src/application/ports/procedureCategoryRepository.js";
import {
  CategoryNameTaken,
  ProcedureCodeTaken,
  ProcedureNameTaken,
} from "../../src/domain/catalog/catalogErrors.js";
import type { LabProcedure, LabProcedureDetails } from "../../src/domain/catalog/labProcedure.js";
import type { ProcedureCategory } from "../../src/domain/catalog/procedureCategory.js";
import type {
  PromotionRecord,
  PromotionRepository,
} from "../../src/application/ports/promotionRepository.js";
import { PromotionNameTaken } from "../../src/domain/catalog/catalogErrors.js";
import type { Promotion, PromotionDetails } from "../../src/domain/catalog/promotion.js";

export class FixedClock implements Clock {
  constructor(public current = new Date("2026-01-15T08:00:00Z")) {}

  now(): Date {
    return new Date(this.current);
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

/** "Hashes" by prefixing, so tests can read what was stored. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(plain: string, hash: string | null): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

/** Tokens are readable JSON; expiry is left to the session, like the real service's `exp`. */
export class FakeTokenService implements TokenService {
  issue(claims: AccessTokenClaims): string {
    return `token:${JSON.stringify(claims)}`;
  }

  verify(token: string): AccessTokenClaims | null {
    if (!token.startsWith("token:")) return null;
    try {
      return JSON.parse(token.slice("token:".length)) as AccessTokenClaims;
    } catch {
      return null;
    }
  }
}

/** Records what would have been emailed. Set `failing` to simulate an SMTP outage. */
export class FakeAccountEmails implements AccountEmails {
  readonly sent: (TemporaryPasswordEmail & { kind: "welcome" | "reissued" })[] = [];
  failing = false;

  async sendStaffWelcome(email: TemporaryPasswordEmail): Promise<void> {
    this.record("welcome", email);
  }

  async sendTemporaryPasswordReissued(email: TemporaryPasswordEmail): Promise<void> {
    this.record("reissued", email);
  }

  private record(kind: "welcome" | "reissued", email: TemporaryPasswordEmail): void {
    if (this.failing) throw new Error("SMTP unavailable");
    this.sent.push({ kind, ...email });
  }
}

/** Predictable passwords: Temp0001, Temp0002, ... */
export class FakeTemporaryPasswordGenerator implements TemporaryPasswordGenerator {
  private issued = 0;

  generate(): string {
    this.issued += 1;
    return `Temp${String(this.issued).padStart(4, "0")}`;
  }
}

export class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, UserProps>();
  readonly lastSignIn = new Map<string, Date>();
  /** Creation order stands in for created_at, so the newest-first sort is testable. */
  readonly createdAt = new Map<string, Date>();
  readonly hiredOn = new Map<string, string | null>();
  /** Custom role names by id, kept up to date by InMemoryRoleRepository. */
  readonly customRoleNames = new Map<string, string>();
  /** Patient details by user id. Patients added with add() get empty details. */
  readonly patients = new Map<string, PatientDetails>();

  /** Adds a user directly, for arranging tests. Password is "Password123" unless given. */
  add(overrides: Partial<UserProps> & { email: string; role?: BaseRole }): User {
    const props: UserProps = {
      id: randomUUID(),
      passwordHash: "hashed:Password123",
      role: "patient",
      firstName: "Test",
      lastName: "User",
      phone: null,
      mustChangePassword: false,
      temporaryPasswordExpiresAt: null,
      customRoleId: null,
      isActive: true,
      ...overrides,
    };
    this.users.set(props.id, props);
    this.createdAt.set(props.id, new Date(Date.UTC(2026, 0, 1) + this.createdAt.size * 60_000));
    if (props.role === "patient") this.patients.set(props.id, { birthDate: null, address: null });
    return User.restore(props);
  }

  async findById(id: string): Promise<User | null> {
    const props = this.users.get(id);
    return props ? User.restore(props) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const props = [...this.users.values()].find((user) => user.email === email);
    return props ? User.restore(props) : null;
  }

  async findProfile(id: string): Promise<UserProfile | null> {
    const props = this.users.get(id);
    if (!props) return null;
    return { user: User.restore(props), patient: this.patients.get(id) ?? null };
  }

  async list({ search, role, isActive, page, pageSize }: UserListQuery): Promise<UserListPage> {
    const needle = search?.toLowerCase();
    const matches = [...this.users.values()]
      .filter(
        (user) =>
          (!needle ||
            [user.email, user.firstName, user.lastName].some((field) =>
              field.toLowerCase().includes(needle),
            )) &&
          (!role || user.role === role) &&
          (isActive === null || user.isActive === isActive),
      )
      .map((user) => this.toListItem(user))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
      items: matches.slice((page - 1) * pageSize, page * pageSize),
      total: matches.length,
    };
  }

  async findListItem(id: string): Promise<UserListItem | null> {
    const props = this.users.get(id);
    return props ? this.toListItem(props) : null;
  }

  private toListItem(props: UserProps): UserListItem {
    const roleName = props.customRoleId ? this.customRoleNames.get(props.customRoleId) : undefined;
    return {
      user: User.restore(props),
      customRole:
        props.customRoleId && roleName ? { id: props.customRoleId, name: roleName } : null,
      lastLoginAt: this.lastSignIn.get(props.id) ?? null,
      createdAt: this.createdAt.get(props.id) ?? new Date(0),
    };
  }

  async createStaffAccount({ hiredOn, ...account }: NewStaffAccount): Promise<User> {
    if (await this.findByEmail(account.email)) throw new EmailAlreadyTaken();
    const user = this.add({ ...account, mustChangePassword: true });
    this.hiredOn.set(user.id, hiredOn);
    return user;
  }

  async createPatientAccount({ birthDate, address, ...account }: NewPatientAccount): Promise<User> {
    if (await this.findByEmail(account.email)) throw new EmailAlreadyTaken();
    const user = this.add({ ...account, role: "patient" });
    this.patients.set(user.id, { birthDate, address });
    return user;
  }

  async recordSignIn(userId: string, at: Date): Promise<void> {
    this.lastSignIn.set(userId, at);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const props = this.users.get(userId);
    if (props) {
      this.users.set(userId, {
        ...props,
        passwordHash,
        mustChangePassword: false,
        temporaryPasswordExpiresAt: null,
      });
    }
  }

  async setTemporaryPassword(userId: string, passwordHash: string, expiresAt: Date): Promise<void> {
    const props = this.users.get(userId);
    if (props) {
      this.users.set(userId, {
        ...props,
        passwordHash,
        mustChangePassword: true,
        temporaryPasswordExpiresAt: expiresAt,
      });
    }
  }

  async setCustomRole(userId: string, customRoleId: string | null): Promise<void> {
    const props = this.users.get(userId);
    if (props) this.users.set(userId, { ...props, customRoleId });
  }

  async setActive(userId: string, isActive: boolean): Promise<void> {
    const props = this.users.get(userId);
    if (props) this.users.set(userId, { ...props, isActive });
  }

  async updateProfile(userId: string, { patient, ...fields }: ProfileChanges): Promise<void> {
    const props = this.users.get(userId);
    if (props) this.users.set(userId, { ...props, ...fields });
    if (patient) this.patients.set(userId, patient);
  }
}

export class InMemorySessionRepository implements SessionRepository {
  readonly sessions = new Map<string, Session>();

  constructor(private readonly clock: Clock) {}

  async create(session: NewSession): Promise<Session> {
    const created: Session = {
      id: randomUUID(),
      userId: session.userId,
      createdAt: this.clock.now(),
      expiresAt: session.expiresAt,
      revokedAt: null,
    };
    this.sessions.set(created.id, created);
    return created;
  }

  async findById(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async revoke(id: string, at: Date): Promise<void> {
    const session = this.sessions.get(id);
    if (session && !session.revokedAt) session.revokedAt = at;
  }

  async revokeAllForUser(userId: string, at: Date, exceptSessionId?: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.id !== exceptSessionId) {
        session.revokedAt ??= at;
      }
    }
  }
}

/** Custom roles in memory. Base roles come from the shared catalogue. */
export class InMemoryRoleRepository implements RoleRepository {
  readonly roles = new Map<string, CustomRole>();

  constructor(private readonly users: InMemoryUserRepository) {}

  /** Adds a role directly, for arranging tests. */
  add(role: Partial<CustomRole> & { name: string; baseRole: CustomRole["baseRole"] }): CustomRole {
    const created: CustomRole = { id: randomUUID(), description: null, entries: [], ...role };
    this.roles.set(created.id, created);
    this.users.customRoleNames.set(created.id, created.name);
    return created;
  }

  async listBaseRoles(): Promise<BaseRoleRecord[]> {
    const holders = [...this.users.users.values()];
    return (["patient", "med_team", "doctor", "support", "admin"] as const).map((id) => ({
      id,
      name: id,
      grants: [...(id === "admin" ? PERMISSION_KEYS : defaultBaseGrants[id])].sort(),
      userCount: holders.filter((user) => user.role === id).length,
    }));
  }

  async listCustomRoles(): Promise<CustomRoleRecord[]> {
    return [...this.roles.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((role) => this.record(role));
  }

  async findCustomRole(id: string): Promise<CustomRoleRecord | null> {
    const role = this.roles.get(id);
    return role ? this.record(role) : null;
  }

  async findCustomRoleByName(name: string): Promise<CustomRole | null> {
    const wanted = name.trim().toLowerCase();
    return [...this.roles.values()].find((role) => role.name.toLowerCase() === wanted) ?? null;
  }

  async createCustomRole(role: NewCustomRole): Promise<CustomRoleRecord> {
    if (await this.findCustomRoleByName(role.name)) throw new CustomRoleNameTaken();
    return this.record(this.add(role));
  }

  async updateCustomRole(id: string, changes: CustomRoleChanges): Promise<void> {
    const role = this.roles.get(id);
    if (!role) return;
    this.roles.set(id, { ...role, ...changes });
    this.users.customRoleNames.set(id, changes.name);
  }

  async deleteCustomRole(id: string): Promise<void> {
    this.roles.delete(id);
    this.users.customRoleNames.delete(id);
  }

  private record(role: CustomRole): CustomRoleRecord {
    const userCount = [...this.users.users.values()].filter(
      (user) => user.customRoleId === role.id,
    ).length;
    return { ...role, userCount };
  }
}

/**
 * The shared catalogue's default grants, the user's custom role (when users and
 * roles are given), and custom-role entries or overrides set per user.
 */
export class InMemoryAccessRepository implements AccessRepository {
  readonly customRole = new Map<string, PermissionEntry[]>();
  readonly overrides = new Map<string, PermissionOverride[]>();

  constructor(
    private readonly users?: InMemoryUserRepository,
    private readonly roles?: InMemoryRoleRepository,
  ) {}

  async loadAccess(userId: string, baseRole: BaseRole): Promise<AccessData> {
    const roleId = this.users?.users.get(userId)?.customRoleId;
    const role = roleId ? this.roles?.roles.get(roleId) : undefined;
    return {
      baseRole,
      allPermissions: PERMISSION_KEYS,
      baseGrants: baseRole === "admin" ? [] : defaultBaseGrants[baseRole],
      customRole: role?.entries ?? this.customRole.get(userId) ?? [],
      overrides: this.overrides.get(userId) ?? [],
    };
  }
}

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Procedure categories in memory; counts come from the procedures fake. */
export class InMemoryProcedureCategoryRepository implements ProcedureCategoryRepository {
  readonly categories = new Map<string, ProcedureCategory>();
  procedures?: InMemoryLabProcedureRepository;

  /** Adds a category directly, for arranging tests. */
  add(name: string): ProcedureCategory {
    const category = { id: randomUUID(), name };
    this.categories.set(category.id, category);
    return category;
  }

  async list(): Promise<ProcedureCategoryRecord[]> {
    return [...this.categories.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((category) => this.record(category));
  }

  async findById(id: string): Promise<ProcedureCategoryRecord | null> {
    const category = this.categories.get(id);
    return category ? this.record(category) : null;
  }

  async findByName(name: string): Promise<ProcedureCategory | null> {
    return [...this.categories.values()].find((category) => sameText(category.name, name)) ?? null;
  }

  async create(name: string): Promise<ProcedureCategoryRecord> {
    if (await this.findByName(name)) throw new CategoryNameTaken();
    return this.record(this.add(name));
  }

  async rename(id: string, name: string): Promise<void> {
    const category = this.categories.get(id);
    if (category) this.categories.set(id, { ...category, name });
  }

  async delete(id: string): Promise<void> {
    this.categories.delete(id);
  }

  private record(category: ProcedureCategory): ProcedureCategoryRecord {
    const procedureCount = [...(this.procedures?.procedures.values() ?? [])].filter(
      (procedure) => procedure.categoryId === category.id,
    ).length;
    return { ...category, procedureCount };
  }
}

/** Lab procedures in memory, joined to the categories fake for names. */
export class InMemoryLabProcedureRepository implements LabProcedureRepository {
  readonly procedures = new Map<string, LabProcedure & { createdAt: Date; updatedAt: Date }>();

  constructor(private readonly categories: InMemoryProcedureCategoryRepository) {
    categories.procedures = this;
  }

  /** Adds a procedure directly, for arranging tests. Defaults fill the rest. */
  add(procedure: Partial<LabProcedure> & { code: string; categoryId: string }): LabProcedure {
    const now = new Date("2026-01-01T00:00:00Z");
    const created = {
      id: randomUUID(),
      name: procedure.code,
      priceCentavos: 35_000,
      specimen: "blood" as const,
      turnaroundHours: 24,
      fastingHours: 0,
      preparation: null,
      description: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...procedure,
    };
    this.procedures.set(created.id, created);
    return created;
  }

  async list(query: LabProcedureListQuery): Promise<LabProcedureListPage> {
    const search = query.search?.toLowerCase();
    const matches = [...this.procedures.values()]
      .filter(
        (procedure) =>
          (!search ||
            procedure.code.toLowerCase().includes(search) ||
            procedure.name.toLowerCase().includes(search)) &&
          (!query.categoryId || procedure.categoryId === query.categoryId) &&
          (query.isActive === null || procedure.isActive === query.isActive),
      )
      .map((procedure) => this.record(procedure))
      .sort(
        (a, b) => a.category.name.localeCompare(b.category.name) || a.name.localeCompare(b.name),
      );
    const start = (query.page - 1) * query.pageSize;
    return { items: matches.slice(start, start + query.pageSize), total: matches.length };
  }

  async findById(id: string): Promise<LabProcedureRecord | null> {
    const procedure = this.procedures.get(id);
    return procedure ? this.record(procedure) : null;
  }

  async findByCode(code: string): Promise<LabProcedure | null> {
    return [...this.procedures.values()].find((procedure) => procedure.code === code) ?? null;
  }

  async findByName(name: string): Promise<LabProcedure | null> {
    return (
      [...this.procedures.values()].find((procedure) => sameText(procedure.name, name)) ?? null
    );
  }

  async create(details: LabProcedureDetails): Promise<LabProcedureRecord> {
    this.assertUnique(details, null);
    const created = this.add(details);
    return this.record(this.procedures.get(created.id) ?? created);
  }

  async update(id: string, details: LabProcedureDetails): Promise<void> {
    this.assertUnique(details, id);
    const procedure = this.procedures.get(id);
    if (procedure) this.procedures.set(id, { ...procedure, ...details });
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const procedure = this.procedures.get(id);
    if (procedure) this.procedures.set(id, { ...procedure, isActive });
  }

  async findExistingIds(ids: readonly string[]): Promise<string[]> {
    return ids.filter((id) => this.procedures.has(id));
  }

  private assertUnique(details: LabProcedureDetails, ownId: string | null) {
    for (const other of this.procedures.values()) {
      if (other.id === ownId) continue;
      if (other.code === details.code) throw new ProcedureCodeTaken();
      if (sameText(other.name, details.name)) throw new ProcedureNameTaken();
    }
  }

  private record(procedure: LabProcedure): LabProcedureRecord {
    const stored = this.procedures.get(procedure.id);
    const category = this.categories.categories.get(procedure.categoryId);
    if (!category) throw new Error(`Procedure ${procedure.code} has no category.`);
    return {
      ...procedure,
      category,
      createdAt: stored?.createdAt ?? new Date(0),
      updatedAt: stored?.updatedAt ?? new Date(0),
    };
  }
}

/** Promotions in memory. */
export class InMemoryPromotionRepository implements PromotionRepository {
  readonly promotions = new Map<string, PromotionRecord>();

  /** Adds a promotion directly, for arranging tests. Defaults: 20% off everything in Jan 2026. */
  add(promotion: Partial<Promotion> & { name: string }): PromotionRecord {
    const now = new Date("2026-01-01T00:00:00Z");
    const created: PromotionRecord = {
      id: randomUUID(),
      description: null,
      discountType: "percent",
      value: 20,
      startsOn: "2026-01-01",
      endsOn: "2026-01-31",
      appliesTo: "all",
      procedureIds: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...promotion,
    };
    this.promotions.set(created.id, created);
    return created;
  }

  async list(): Promise<PromotionRecord[]> {
    return [...this.promotions.values()].sort(
      (a, b) => b.startsOn.localeCompare(a.startsOn) || a.name.localeCompare(b.name),
    );
  }

  async listRunningOn(date: string): Promise<Promotion[]> {
    return [...this.promotions.values()].filter(
      (promotion) =>
        promotion.isActive &&
        promotion.startsOn <= date &&
        (promotion.endsOn === null || promotion.endsOn >= date),
    );
  }

  async findById(id: string): Promise<PromotionRecord | null> {
    return this.promotions.get(id) ?? null;
  }

  async findByName(name: string): Promise<Promotion | null> {
    return (
      [...this.promotions.values()].find((promotion) => sameText(promotion.name, name)) ?? null
    );
  }

  async create(details: PromotionDetails): Promise<PromotionRecord> {
    if (await this.findByName(details.name)) throw new PromotionNameTaken();
    return this.add(details);
  }

  async update(id: string, details: PromotionDetails): Promise<void> {
    const promotion = this.promotions.get(id);
    if (promotion) this.promotions.set(id, { ...promotion, ...details });
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const promotion = this.promotions.get(id);
    if (promotion) this.promotions.set(id, { ...promotion, isActive });
  }
}
