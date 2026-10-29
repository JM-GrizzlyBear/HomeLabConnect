import type { AuditGroup } from "@homelabconnect/shared";

/** What each recorded action means, in plain words. */
export const auditActionLabels: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in",
  "auth.logout": "Signed out",
  "auth.password_changed": "Changed password",
  "users.create": "Created a staff account",
  "users.set_active": "Activated / deactivated a user",
  "users.reissue_password": "Reissued a temporary password",
  "users.assign_role": "Changed a user's role",
  "roles.create": "Created a role",
  "roles.update": "Changed a role",
  "roles.delete": "Deleted a role",
  "settings.update": "Changed the settings",
  "closed_days.add": "Added a closed day",
  "closed_days.update": "Changed a closed day",
  "closed_days.remove": "Removed a closed day",
  "categories.create": "Added a category",
  "categories.rename": "Renamed a category",
  "categories.delete": "Deleted a category",
  "procedures.create": "Added a test",
  "procedures.update": "Changed a test",
  "procedures.set_active": "Activated / deactivated a test",
  "promotions.create": "Added a promotion",
  "promotions.update": "Changed a promotion",
  "promotions.set_active": "Activated / deactivated a promotion",
  "teams.create": "Created a team",
  "teams.update": "Changed a team",
  "teams.set_active": "Activated / deactivated a team",
  "teams.save_roster": "Saved a roster",
  "teams.copy_rosters": "Copied the previous rosters",
  "shifts.set_days": "Changed someone's shifts",
  "leave.decide": "Decided a leave request",
  "payments.refund": "Refunded a payment",
  "payments.record_cash": "Recorded a cash payment",
};

export const auditGroupLabels: Record<AuditGroup, string> = {
  sign_ins: "Sign-ins",
  failed_sign_ins: "Failed sign-ins",
  users: "Users & roles",
  settings: "Settings",
  catalog: "Catalog",
  scheduling: "Scheduling",
  payments: "Payments",
};

/** "Chrome on Windows"-ish, short enough for a table cell. */
export function shortBrowser(userAgent: string | null): string {
  if (!userAgent) return "—";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : null;
  const system = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad/.test(userAgent)
        ? "iOS"
        : /Mac OS/.test(userAgent)
          ? "macOS"
          : null;
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? userAgent.slice(0, 30);
}
