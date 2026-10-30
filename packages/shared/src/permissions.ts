import { z } from "zod";

/**
 * The permission catalogue: every module and the actions it guards. A
 * permission key is `<module>.<action>`, e.g. "payments.refund". This is the
 * single source of truth: the seed writes it to the database, the API guards
 * routes with it and the client builds its menu from it. See docs/PERMISSIONS.md.
 */
const catalog = {
  dashboard: { name: "Dashboard", actions: { view: "View the dashboard" } },
  users: {
    name: "Users",
    actions: {
      view: "View user accounts",
      create: "Create staff accounts",
      update: "Edit user accounts",
      deactivate: "Deactivate and reactivate accounts",
      reset_password: "Issue temporary passwords",
      export: "Export the user list",
    },
  },
  roles: {
    name: "Roles",
    actions: {
      view: "View roles",
      manage: "Create and edit custom roles",
      assign: "Assign custom roles to users",
    },
  },
  permissions: {
    name: "Permissions",
    actions: {
      view: "View a user's permissions",
      override: "Grant or deny permissions to a user",
    },
  },
  procedures: {
    name: "Lab procedures",
    actions: { view: "View procedures and prices", manage: "Manage procedures and prices" },
  },
  promotions: {
    name: "Promotions",
    actions: { view: "View promotions", manage: "Manage promotions" },
  },
  shifts: {
    name: "Shifts",
    actions: {
      view_own: "View own shifts",
      view: "View everyone's shifts",
      manage: "Manage shifts",
    },
  },
  leave: {
    name: "Leave",
    actions: {
      request: "Request leave",
      view: "View leave requests",
      approve: "Approve or reject leave",
    },
  },
  holidays: {
    name: "Holidays",
    actions: { view: "View holidays", manage: "Manage holidays" },
  },
  teams: {
    name: "Med teams",
    actions: {
      view: "View med teams",
      manage: "Manage med teams",
      roster: "Manage team rosters",
    },
  },
  appointments: {
    name: "Appointments",
    actions: {
      book: "Book home visits",
      view_own: "View own appointments",
      view_all: "View all appointments",
      accept: "Accept bookings",
      reject: "Reject bookings",
      reschedule: "Propose new times",
      assign: "Assign med teams",
      cancel: "Cancel appointments",
      review: "Review a finished visit",
    },
  },
  visits: {
    name: "Visits",
    actions: {
      view_assigned: "View assigned visits",
      collect: "Record sample collection",
      schedule_return: "Schedule return visits",
    },
  },
  routes: {
    name: "Daily routes",
    actions: { view: "View daily routes", manage: "Plan daily routes" },
  },
  notes: {
    name: "Notes & attachments",
    actions: {
      view: "View appointment notes",
      create: "Add appointment notes",
      attach: "Upload attachments",
    },
  },
  results: {
    name: "Results",
    actions: {
      view_own: "View own results",
      review: "Review collected samples",
      upload: "Upload result files",
      release: "Release results to patients",
    },
  },
  payments: {
    name: "Payments",
    actions: {
      pay: "Pay online",
      view_own: "View own payments",
      view_all: "View all payments",
      record_cash: "Record cash payments",
      refund: "Issue refunds",
      export: "Export payments",
    },
  },
  support: {
    name: "Support desk",
    actions: {
      create_ticket: "Open support tickets",
      view_own: "View own tickets",
      view_queue: "View the ticket queue",
      handle: "Reply to and handle tickets",
      assign: "Reassign tickets",
      close: "Close tickets",
    },
  },
  chat: { name: "Chat", actions: { use: "Use ticket chat" } },
  audit: { name: "Audit logs", actions: { view: "View audit logs" } },
  reports: {
    name: "Reports",
    actions: { view: "View reports", save: "Save report filters", export: "Export reports" },
  },
  settings: {
    name: "System settings",
    actions: { view: "View system settings", manage: "Change system settings" },
  },
} as const satisfies Record<string, { name: string; actions: Record<string, string> }>;

type Catalog = typeof catalog;
export type PermissionModuleId = keyof Catalog;
export type PermissionKey = {
  [M in PermissionModuleId]: `${M}.${keyof Catalog[M]["actions"] & string}`;
}[PermissionModuleId];

export interface PermissionModule {
  id: PermissionModuleId;
  name: string;
  permissions: { key: PermissionKey; label: string }[];
}

/** Modules in display order, each with its permissions. */
export const permissionModules: readonly PermissionModule[] = (
  Object.entries(catalog) as [PermissionModuleId, Catalog[PermissionModuleId]][]
).map(([id, module]) => ({
  id,
  name: module.name,
  permissions: Object.entries(module.actions).map(([action, label]) => ({
    key: `${id}.${action}` as PermissionKey,
    label,
  })),
}));

export const PERMISSION_KEYS: readonly PermissionKey[] = permissionModules.flatMap((module) =>
  module.permissions.map((permission) => permission.key),
);

export function isPermissionKey(value: string): value is PermissionKey {
  return (PERMISSION_KEYS as readonly string[]).includes(value);
}

export const permissionKeySchema = z.enum(PERMISSION_KEYS as [PermissionKey, ...PermissionKey[]]);

/**
 * What each base role can do out of the box. Admin isn't listed: it always has
 * every permission, so no one can lock the admins out.
 */
export const defaultBaseGrants: Record<
  "patient" | "med_team" | "doctor" | "support",
  readonly PermissionKey[]
> = {
  patient: [
    "dashboard.view",
    "procedures.view",
    "promotions.view",
    "appointments.book",
    "appointments.view_own",
    "appointments.cancel",
    "appointments.review",
    "results.view_own",
    "payments.pay",
    "payments.view_own",
    "support.create_ticket",
    "support.view_own",
    "chat.use",
  ],
  med_team: [
    "dashboard.view",
    "procedures.view",
    "shifts.view_own",
    "leave.request",
    "holidays.view",
    "teams.view",
    "visits.view_assigned",
    "visits.collect",
    "visits.schedule_return",
    "routes.view",
    "notes.view",
    "notes.create",
    "notes.attach",
    "payments.record_cash",
    "chat.use",
  ],
  doctor: [
    "dashboard.view",
    "procedures.view",
    "shifts.view_own",
    "leave.request",
    "holidays.view",
    "appointments.view_all",
    "notes.view",
    "notes.create",
    "results.review",
    "results.upload",
    "results.release",
    "chat.use",
  ],
  support: [
    "dashboard.view",
    "users.view",
    "procedures.view",
    "promotions.view",
    "shifts.view_own",
    "leave.request",
    "holidays.view",
    "appointments.view_all",
    "appointments.accept",
    "appointments.reject",
    "appointments.reschedule",
    "notes.view",
    "payments.view_all",
    "support.view_queue",
    "support.handle",
    "support.close",
    "chat.use",
  ],
};
