// In-memory stand-ins for the ports, for unit and route tests. Not part of the build.
import { randomUUID } from "node:crypto";
import { defaultBaseGrants, PERMISSION_KEYS } from "@homelabconnect/shared";
import type { AccessRepository } from "../../src/application/ports/accessRepository.js";
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
    return {
      user: User.restore(props),
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

/** The shared catalogue's default grants, plus custom-role entries and overrides set per user. */
export class InMemoryAccessRepository implements AccessRepository {
  readonly customRole = new Map<string, PermissionEntry[]>();
  readonly overrides = new Map<string, PermissionOverride[]>();

  async loadAccess(userId: string, baseRole: BaseRole): Promise<AccessData> {
    return {
      baseRole,
      allPermissions: PERMISSION_KEYS,
      baseGrants: baseRole === "admin" ? [] : defaultBaseGrants[baseRole],
      customRole: this.customRole.get(userId) ?? [],
      overrides: this.overrides.get(userId) ?? [],
    };
  }
}
