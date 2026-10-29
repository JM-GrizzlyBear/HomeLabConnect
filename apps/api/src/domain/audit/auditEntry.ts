/** Something someone did that admins may need to trace later: a sign-in or an admin change. */
export interface NewAuditEntry {
  /** Who did it; null when unknown (a failed sign-in). */
  actorId: string | null;
  /** "<area>.<verb>", e.g. "auth.login_failed", "roles.update". */
  action: string;
  /** What it was done to, e.g. "role" and its id. */
  targetType: string | null;
  targetId: string | null;
  /** A short human summary, e.g. the email tried or the new name. */
  summary: string | null;
  ip: string | null;
  userAgent: string | null;
}

export interface AuditEntry extends NewAuditEntry {
  id: string;
  at: Date;
  actor: { id: string; name: string; email: string } | null;
}

/** The groups admins filter the log by, as action prefixes. */
export const AUDIT_GROUPS = {
  sign_ins: ["auth.login", "auth.logout", "auth.password_changed"],
  failed_sign_ins: ["auth.login_failed"],
  users: ["users.", "roles."],
  settings: ["settings.", "closed_days."],
  catalog: ["procedures.", "categories.", "promotions."],
  scheduling: ["teams.", "shifts.", "leave."],
  payments: ["payments."],
} as const satisfies Record<string, readonly string[]>;

export type AuditGroup = keyof typeof AUDIT_GROUPS;

/**
 * Whether an action belongs to a group. "auth.login" must not also match
 * "auth.login_failed", so a prefix without a dot is an exact action.
 */
export function inGroup(action: string, group: AuditGroup): boolean {
  return AUDIT_GROUPS[group].some((prefix) =>
    prefix.endsWith(".") ? action.startsWith(prefix) : action === prefix,
  );
}

export interface AuditQuery {
  group: AuditGroup | null;
  /** Matches the actor's name or email, or the summary. */
  q: string | null;
  /** Business dates, Philippine time. */
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
}

/** Port: the audit log, kept for admins. Entries are only ever added. */
export interface AuditLog {
  record(entry: NewAuditEntry & { at: Date }): Promise<void>;
  list(query: AuditQuery): Promise<{ items: AuditEntry[]; total: number }>;
}
