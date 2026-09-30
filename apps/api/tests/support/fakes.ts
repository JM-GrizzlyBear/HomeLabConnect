// In-memory stand-ins for the ports, for unit and route tests. Not part of the build.
import { randomUUID } from "node:crypto";
import type { Clock } from "../../src/application/ports/clock.js";
import type { PasswordHasher } from "../../src/application/ports/passwordHasher.js";
import type {
  NewSession,
  SessionRepository,
} from "../../src/application/ports/sessionRepository.js";
import type { AccessTokenClaims, TokenService } from "../../src/application/ports/tokenService.js";
import type {
  NewPatientAccount,
  UserProfile,
  UserRepository,
} from "../../src/application/ports/userRepository.js";
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

export class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, UserProps>();
  readonly lastSignIn = new Map<string, Date>();
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
      isActive: true,
      ...overrides,
    };
    this.users.set(props.id, props);
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
    if (props) this.users.set(userId, { ...props, passwordHash, mustChangePassword: false });
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
