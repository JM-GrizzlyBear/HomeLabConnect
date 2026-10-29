import { formatPeso } from "@homelabconnect/shared";
import type { RecordAuditEntry } from "../../application/audit/RecordAuditEntry.js";
import { type AuditOptions, AuditedController } from "./AuditedController.js";
import type { Controller, HttpRequest } from "./httpTypes.js";

type Body = Record<string, unknown>;
const bodyOf = (value: unknown): Body =>
  value !== null && typeof value === "object" ? (value as Body) : {};
const text = (value: unknown): string | null =>
  typeof value === "string" && value ? value.slice(0, 200) : null;

/** The email a sign-in was tried with (never the password). */
const emailTried = (request: HttpRequest) => text(bodyOf(request.body).email);

/** Which calls go in the audit log: sign-ins and admin changes, keyed by controller. */
const AUDITED: Record<string, [action: string, options?: AuditOptions]> = {
  // Sign-ins
  login: [
    "auth.login",
    {
      target: "user",
      recordFailure: true,
      actor: (_request, response) => text(bodyOf(bodyOf(response?.body).user).id),
      describe: emailTried,
    },
  ],
  logout: ["auth.logout", { describe: () => null }],
  changePassword: ["auth.password_changed", { describe: () => null }],
  // Users and roles
  createStaffAccount: ["users.create", { target: "user" }],
  setUserActive: ["users.set_active", { target: "user" }],
  reissueTemporaryPassword: ["users.reissue_password", { target: "user" }],
  assignCustomRole: ["users.assign_role", { target: "user" }],
  createCustomRole: ["roles.create", { target: "role" }],
  updateCustomRole: ["roles.update", { target: "role" }],
  deleteCustomRole: ["roles.delete", { target: "role" }],
  // Settings and closed days
  updateSystemSettings: ["settings.update", { describe: () => null }],
  addClosedDay: ["closed_days.add", { target: "closed_day" }],
  updateClosedDay: ["closed_days.update", { target: "closed_day" }],
  removeClosedDay: ["closed_days.remove", { target: "closed_day" }],
  // Catalog
  createProcedureCategory: ["categories.create", { target: "category" }],
  renameProcedureCategory: ["categories.rename", { target: "category" }],
  deleteProcedureCategory: ["categories.delete", { target: "category" }],
  createLabProcedure: ["procedures.create", { target: "procedure" }],
  updateLabProcedure: ["procedures.update", { target: "procedure" }],
  setLabProcedureActive: ["procedures.set_active", { target: "procedure" }],
  createPromotion: ["promotions.create", { target: "promotion" }],
  updatePromotion: ["promotions.update", { target: "promotion" }],
  setPromotionActive: ["promotions.set_active", { target: "promotion" }],
  // Scheduling
  createTeam: ["teams.create", { target: "team" }],
  updateTeam: ["teams.update", { target: "team" }],
  setTeamActive: ["teams.set_active", { target: "team" }],
  saveRoster: ["teams.save_roster", { target: "team" }],
  copyPreviousRosters: ["teams.copy_rosters"],
  setShiftDays: ["shifts.set_days", { target: "user" }],
  decideLeave: ["leave.decide", { target: "leave" }],
  // Reports
  saveReport: ["reports.save", { target: "saved_report" }],
  deleteSavedReport: ["reports.delete_saved", { target: "saved_report", describe: () => null }],
  // Payments
  refundPayment: [
    "payments.refund",
    {
      target: "payment",
      describe: (request) => {
        const body = bodyOf(request.body);
        const amount =
          typeof body.amountCentavos === "number" ? formatPeso(body.amountCentavos) : "";
        return [amount, text(body.reason)].filter(Boolean).join(" · ") || null;
      },
    },
  ],
  recordCashPayment: ["payments.record_cash", { target: "appointment" }],
};

/**
 * Wraps the controllers named above so their calls are written to the audit log. The rest
 * are passed through unchanged.
 */
export function withAuditLog<T extends Record<string, Controller>>(
  controllers: T,
  recordAuditEntry: RecordAuditEntry,
): T {
  const wrapped: Record<string, Controller> = { ...controllers };
  for (const [name, [action, options]] of Object.entries(AUDITED)) {
    const controller = controllers[name];
    if (!controller) throw new Error(`The audit plan names an unknown controller: ${name}.`);
    wrapped[name] = new AuditedController(controller, recordAuditEntry, action, options);
  }
  return wrapped as T;
}
