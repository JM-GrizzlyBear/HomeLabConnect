// In-memory stand-ins for the ports, for unit and route tests. Not part of the build.
import { randomUUID } from "node:crypto";
import type { Clock } from "../application/ports/clock.js";
import type { PasswordHasher } from "../application/ports/passwordHasher.js";
import type { NewSession, SessionRepository } from "../application/ports/sessionRepository.js";
import type { AccessTokenClaims, TokenService } from "../application/ports/tokenService.js";
import type { NewPatientAccount, UserRepository } from "../application/ports/userRepository.js";
import type { BaseRole } from "../domain/identity/baseRole.js";
import { EmailAlreadyTaken } from "../domain/identity/identityErrors.js";
import type { Session } from "../domain/identity/session.js";
import { User, type UserProps } from "../domain/identity/user.js";

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

  async createPatientAccount(account: NewPatientAccount): Promise<User> {
    if (await this.findByEmail(account.email)) throw new EmailAlreadyTaken();
    return this.add({ ...account, role: "patient" });
  }

  async recordSignIn(userId: string, at: Date): Promise<void> {
    this.lastSignIn.set(userId, at);
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
}
