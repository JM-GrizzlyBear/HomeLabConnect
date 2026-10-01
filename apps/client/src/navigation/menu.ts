import type { PermissionKey } from "@homelabconnect/shared";

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
   * The permission needed to see this entry; null means every signed-in user.
   * Hiding an entry is a convenience only: the API enforces access.
   */
  permission: PermissionKey | null;
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

const link = (
  label: string,
  path: string,
  permission: PermissionKey | null,
  module: string,
  icon?: NavIconName,
): NavLink => ({ kind: "link", label, path, permission, module, icon });

const group = (label: string, icon: NavIconName, children: NavLink[]): NavGroup => ({
  kind: "group",
  label,
  icon,
  children,
});

export const menu: NavEntry[] = [
  link("Dashboard", "/app", "dashboard.view", "Module 11 · Reports & Dashboard", "dashboard"),
  group("Appointments", "calendar", [
    link("Book a Visit", "/app/appointments/book", "appointments.book", "Module 5 · Appointments"),
    link(
      "My Appointments",
      "/app/appointments/mine",
      "appointments.view_own",
      "Module 5 · Appointments",
    ),
    link(
      "My Visits",
      "/app/appointments/visits",
      "visits.view_assigned",
      "Module 5 · Appointments",
    ),
    link("Daily Route", "/app/appointments/route", "routes.view", "Module 5 · Appointments"),
    link(
      "All Appointments",
      "/app/appointments/all",
      "appointments.view_all",
      "Module 5 · Appointments",
    ),
  ]),
  group("Results", "flask", [
    link("My Results", "/app/results/mine", "results.view_own", "Module 6 · Results"),
    link("Review Queue", "/app/results/review", "results.review", "Module 6 · Results"),
  ]),
  group("Payments", "wallet", [
    link("My Payments", "/app/payments/mine", "payments.view_own", "Module 7 · Payments"),
    link("All Payments", "/app/payments/all", "payments.view_all", "Module 7 · Payments"),
    link("Refunds", "/app/payments/refunds", "payments.refund", "Module 7 · Payments"),
  ]),
  group("Support", "lifebuoy", [
    link("My Tickets", "/app/support/tickets", "support.view_own", "Module 8 · Support Desk"),
    link("Ticket Queue", "/app/support/queue", "support.view_queue", "Module 8 · Support Desk"),
  ]),
  group("Users", "users", [
    link("All Users", "/app/users/all", "users.view", "Module 1 · Accounts"),
    link("Create Staff", "/app/users/new", "users.create", "Module 1 · Accounts"),
    link("Roles & Permissions", "/app/users/roles", "roles.view", "Module 2 · Roles & Permissions"),
    link("Reports", "/app/users/reports", "reports.view", "Module 11 · Reports & Dashboard"),
  ]),
  group("Scheduling", "clock", [
    link("Shifts", "/app/scheduling/shifts", "shifts.view", "Module 4 · Scheduling & Teams"),
    link("Leave Requests", "/app/scheduling/leave", "leave.view", "Module 4 · Scheduling & Teams"),
    link("Teams", "/app/scheduling/teams", "teams.view", "Module 4 · Scheduling & Teams"),
    link(
      "Holidays & Closed Days",
      "/app/scheduling/holidays",
      "holidays.view",
      "Module 12 · System Settings",
    ),
  ]),
  group("Catalog", "tag", [
    link(
      "Procedures",
      "/app/catalog/procedures",
      "procedures.view",
      "Module 3 · Lab Procedure Catalog",
    ),
    link(
      "Promotions",
      "/app/catalog/promotions",
      "promotions.view",
      "Module 3 · Lab Procedure Catalog",
    ),
  ]),
  link("Account Profile", "/app/profile", null, "Module 1 · Accounts", "user"),
  link("Settings", "/app/settings", "settings.view", "Module 12 · System Settings", "settings"),
];

/** True when `permissions` include what the link needs. */
export function canSee(link: NavLink, permissions: readonly string[]): boolean {
  return link.permission === null || permissions.includes(link.permission);
}

/** The menu for a user with these permissions. Groups with nothing visible are dropped. */
export function visibleMenu(
  permissions: readonly string[],
  entries: NavEntry[] = menu,
): NavEntry[] {
  return entries.flatMap((entry): NavEntry[] => {
    if (entry.kind === "link") return canSee(entry, permissions) ? [entry] : [];
    const children = entry.children.filter((child) => canSee(child, permissions));
    return children.length > 0 ? [{ ...entry, children }] : [];
  });
}

/** Finds the link for a path anywhere in the full menu (not filtered by permission). */
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
