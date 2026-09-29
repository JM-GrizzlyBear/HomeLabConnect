import type { BaseRole } from "@homelabconnect/shared";

export type NavIconName =
  | "dashboard"
  | "calendar"
  | "flask"
  | "wallet"
  | "lifebuoy"
  | "users"
  | "clock"
  | "tag"
  | "user"
  | "settings";

export interface NavLink {
  kind: "link";
  label: string;
  path: string;
  /**
   * Who sees this entry. Module 2 replaces roles with permission keys
   * (e.g. "users.view"); the sidebar itself won't change.
   * Hiding an entry is a convenience only: the API enforces access.
   */
  roles: readonly BaseRole[];
  /** Where the page gets built, shown on the Coming soon page until then. */
  module: string;
  icon?: NavIconName;
}

export interface NavGroup {
  kind: "group";
  label: string;
  icon: NavIconName;
  children: NavLink[];
}

export type NavEntry = NavLink | NavGroup;

const ALL: readonly BaseRole[] = ["patient", "med_team", "doctor", "support", "admin"];

const link = (
  label: string,
  path: string,
  roles: readonly BaseRole[],
  module: string,
  icon?: NavIconName,
): NavLink => ({ kind: "link", label, path, roles, module, icon });

const group = (label: string, icon: NavIconName, children: NavLink[]): NavGroup => ({
  kind: "group",
  label,
  icon,
  children,
});

export const menu: NavEntry[] = [
  link("Dashboard", "/app", ALL, "Module 11 · Reports & Dashboard", "dashboard"),
  group("Appointments", "calendar", [
    link("Book a Visit", "/app/appointments/book", ["patient"], "Module 5 · Appointments"),
    link("My Appointments", "/app/appointments/mine", ["patient"], "Module 5 · Appointments"),
    link("My Visits", "/app/appointments/visits", ["med_team"], "Module 5 · Appointments"),
    link("Daily Route", "/app/appointments/route", ["med_team"], "Module 5 · Appointments"),
    link(
      "All Appointments",
      "/app/appointments/all",
      ["admin", "support"],
      "Module 5 · Appointments",
    ),
  ]),
  group("Results", "flask", [
    link("My Results", "/app/results/mine", ["patient"], "Module 6 · Results"),
    link("Review Queue", "/app/results/review", ["doctor"], "Module 6 · Results"),
  ]),
  group("Payments", "wallet", [
    link("My Payments", "/app/payments/mine", ["patient"], "Module 7 · Payments"),
    link("All Payments", "/app/payments/all", ["admin"], "Module 7 · Payments"),
    link("Refunds", "/app/payments/refunds", ["admin"], "Module 7 · Payments"),
  ]),
  group("Support", "lifebuoy", [
    link("My Tickets", "/app/support/tickets", ["patient"], "Module 8 · Support Desk"),
    link("Ticket Queue", "/app/support/queue", ["support", "admin"], "Module 8 · Support Desk"),
  ]),
  group("Users", "users", [
    link("All Users", "/app/users/all", ["admin"], "Module 1 · Accounts"),
    link("Create Staff", "/app/users/new", ["admin"], "Module 1 · Accounts"),
    link("Reports", "/app/users/reports", ["admin"], "Module 11 · Reports & Dashboard"),
  ]),
  group("Scheduling", "clock", [
    link("Shifts", "/app/scheduling/shifts", ["admin"], "Module 4 · Scheduling & Teams"),
    link("Leave Requests", "/app/scheduling/leave", ["admin"], "Module 4 · Scheduling & Teams"),
    link("Teams", "/app/scheduling/teams", ["admin"], "Module 4 · Scheduling & Teams"),
  ]),
  group("Catalog", "tag", [
    link("Procedures", "/app/catalog/procedures", ["admin"], "Module 3 · Lab Procedure Catalog"),
    link("Promotions", "/app/catalog/promotions", ["admin"], "Module 3 · Lab Procedure Catalog"),
  ]),
  link("Account Profile", "/app/profile", ALL, "Module 1 · Accounts", "user"),
  link("Settings", "/app/settings", ["admin"], "Module 12 · System Settings", "settings"),
];

/** The menu as a given role sees it. Groups with nothing visible are dropped. */
export function visibleMenu(role: BaseRole, entries: NavEntry[] = menu): NavEntry[] {
  return entries.flatMap((entry): NavEntry[] => {
    if (entry.kind === "link") return entry.roles.includes(role) ? [entry] : [];
    const children = entry.children.filter((child) => child.roles.includes(role));
    return children.length > 0 ? [{ ...entry, children }] : [];
  });
}

/** Finds the link for a path anywhere in the full menu (not filtered by role). */
export function findMenuLink(path: string, entries: NavEntry[] = menu): NavLink | undefined {
  for (const entry of entries) {
    if (entry.kind === "link" && entry.path === path) return entry;
    if (entry.kind === "group") {
      const match = entry.children.find((child) => child.path === path);
      if (match) return match;
    }
  }
  return undefined;
}
