import type {
  ListNotificationsController,
  MarkAllNotificationsReadController,
  MarkNotificationReadController,
} from "../../interface/http/controllers/NotificationControllers.js";
import type { OpenTicketController } from "../../interface/http/controllers/OpenTicketController.js";
import type { ListMyTicketsController } from "../../interface/http/controllers/ListMyTicketsController.js";
import type { ListTicketQueueController } from "../../interface/http/controllers/ListTicketQueueController.js";
import type { GetTicketController } from "../../interface/http/controllers/GetTicketController.js";
import type { PostTicketMessageController } from "../../interface/http/controllers/PostTicketMessageController.js";
import type { OpenMessageAttachmentController } from "../../interface/http/controllers/OpenMessageAttachmentController.js";
import type { ListSupportAgentsController } from "../../interface/http/controllers/ListSupportAgentsController.js";
import type {
  ClaimTicketController,
  CloseTicketController,
  RateTicketController,
  ReassignTicketController,
  SetTicketPriorityController,
} from "../../interface/http/controllers/ManageTicketControllers.js";
import { Router } from "express";
import type {
  ExportUsersController,
  GetUserPermissionsController,
  SetUserOverridesController,
  UpdateUserController,
} from "../../interface/http/controllers/UserAdminControllers.js";
import type {
  GetAppointmentReviewController,
  ReviewAppointmentController,
} from "../../interface/http/controllers/AppointmentReviewControllers.js";
import type {
  RequestPasswordResetController,
  ResetPasswordController,
} from "../../interface/http/controllers/PasswordResetControllers.js";
import type { RunReportController } from "../../interface/http/controllers/RunReportController.js";
import type { ListSavedReportsController } from "../../interface/http/controllers/ListSavedReportsController.js";
import type { SaveReportController } from "../../interface/http/controllers/SaveReportController.js";
import type { DeleteSavedReportController } from "../../interface/http/controllers/DeleteSavedReportController.js";
import type { ListAuditLogController } from "../../interface/http/controllers/ListAuditLogController.js";
import type { GetDashboardController } from "../../interface/http/controllers/GetDashboardController.js";
import type { GetAppointmentResultsController } from "../../interface/http/controllers/GetAppointmentResultsController.js";
import type { UploadTestResultController } from "../../interface/http/controllers/UploadTestResultController.js";
import type { DeleteTestResultController } from "../../interface/http/controllers/DeleteTestResultController.js";
import type { ReleaseResultsController } from "../../interface/http/controllers/ReleaseResultsController.js";
import type { OpenResultFileController } from "../../interface/http/controllers/OpenResultFileController.js";
import type { ListReviewQueueController } from "../../interface/http/controllers/ListReviewQueueController.js";
import type { ListMyResultsController } from "../../interface/http/controllers/ListMyResultsController.js";
import type { StartCardPaymentController } from "../../interface/http/controllers/StartCardPaymentController.js";
import type { RecordCashPaymentController } from "../../interface/http/controllers/RecordCashPaymentController.js";
import type { HandlePaymentWebhookController } from "../../interface/http/controllers/HandlePaymentWebhookController.js";
import type { RefundPaymentController } from "../../interface/http/controllers/RefundPaymentController.js";
import type { ListPaymentsController } from "../../interface/http/controllers/ListPaymentsController.js";
import type { ExportPaymentsController } from "../../interface/http/controllers/ExportPaymentsController.js";
import type { ListMyPaymentsController } from "../../interface/http/controllers/ListMyPaymentsController.js";
import type { ListAppointmentPaymentsController } from "../../interface/http/controllers/ListAppointmentPaymentsController.js";
import type { ListAppointmentNotesController } from "../../interface/http/controllers/ListAppointmentNotesController.js";
import type { AddAppointmentNoteController } from "../../interface/http/controllers/AddAppointmentNoteController.js";
import type { DeleteAttachmentController } from "../../interface/http/controllers/DeleteAttachmentController.js";
import type { ScheduleReturnVisitController } from "../../interface/http/controllers/ScheduleReturnVisitController.js";
import type { ListRouteTeamsController } from "../../interface/http/controllers/ListRouteTeamsController.js";
import type { GetDailyRouteController } from "../../interface/http/controllers/GetDailyRouteController.js";
import type { ReorderRouteController } from "../../interface/http/controllers/ReorderRouteController.js";
import type { ListTeamChoicesController } from "../../interface/http/controllers/ListTeamChoicesController.js";
import type { AssignTeamController } from "../../interface/http/controllers/AssignTeamController.js";
import type { ListMyVisitsController } from "../../interface/http/controllers/ListMyVisitsController.js";
import type { RecordVisitController } from "../../interface/http/controllers/RecordVisitController.js";
import type { GetAvailabilityController } from "../../interface/http/controllers/GetAvailabilityController.js";
import type { QuoteBookingController } from "../../interface/http/controllers/QuoteBookingController.js";
import type { BookAppointmentController } from "../../interface/http/controllers/BookAppointmentController.js";
import type { ListMyAppointmentsController } from "../../interface/http/controllers/ListMyAppointmentsController.js";
import type { GetAppointmentController } from "../../interface/http/controllers/GetAppointmentController.js";
import type { CancelAppointmentController } from "../../interface/http/controllers/CancelAppointmentController.js";
import type { ListAppointmentsController } from "../../interface/http/controllers/ListAppointmentsController.js";
import type { DecideAppointmentController } from "../../interface/http/controllers/DecideAppointmentController.js";
import type { ProposeNewTimeController } from "../../interface/http/controllers/ProposeNewTimeController.js";
import type { AnswerProposalController } from "../../interface/http/controllers/AnswerProposalController.js";
import { rateLimit } from "express-rate-limit";
import type { AssignCustomRoleController } from "../../interface/http/controllers/AssignCustomRoleController.js";
import type { CreateCustomRoleController } from "../../interface/http/controllers/CreateCustomRoleController.js";
import type { DeleteCustomRoleController } from "../../interface/http/controllers/DeleteCustomRoleController.js";
import type { GetCustomRoleController } from "../../interface/http/controllers/GetCustomRoleController.js";
import type { ListRolesController } from "../../interface/http/controllers/ListRolesController.js";
import type { UpdateCustomRoleController } from "../../interface/http/controllers/UpdateCustomRoleController.js";
import type { ChangePasswordController } from "../../interface/http/controllers/ChangePasswordController.js";
import type { CreateStaffAccountController } from "../../interface/http/controllers/CreateStaffAccountController.js";
import type { GetCurrentUserController } from "../../interface/http/controllers/GetCurrentUserController.js";
import type { GetProfileController } from "../../interface/http/controllers/GetProfileController.js";
import type { HealthController } from "../../interface/http/controllers/HealthController.js";
import type { ListUsersController } from "../../interface/http/controllers/ListUsersController.js";
import type { LoginController } from "../../interface/http/controllers/LoginController.js";
import type { LogoutController } from "../../interface/http/controllers/LogoutController.js";
import type { RegisterPatientController } from "../../interface/http/controllers/RegisterPatientController.js";
import type { ReissueTemporaryPasswordController } from "../../interface/http/controllers/ReissueTemporaryPasswordController.js";
import type { SetUserActiveController } from "../../interface/http/controllers/SetUserActiveController.js";
import type { UpdateProfileController } from "../../interface/http/controllers/UpdateProfileController.js";
import type { RemoveProfilePhotoController } from "../../interface/http/controllers/RemoveProfilePhotoController.js";
import type { SetProfilePhotoController } from "../../interface/http/controllers/SetProfilePhotoController.js";
import type { CreateLabProcedureController } from "../../interface/http/controllers/CreateLabProcedureController.js";
import type { CreateProcedureCategoryController } from "../../interface/http/controllers/CreateProcedureCategoryController.js";
import type { DeleteProcedureCategoryController } from "../../interface/http/controllers/DeleteProcedureCategoryController.js";
import type { GetLabProcedureController } from "../../interface/http/controllers/GetLabProcedureController.js";
import type { ListLabProceduresController } from "../../interface/http/controllers/ListLabProceduresController.js";
import type { ListProcedureCategoriesController } from "../../interface/http/controllers/ListProcedureCategoriesController.js";
import type { RenameProcedureCategoryController } from "../../interface/http/controllers/RenameProcedureCategoryController.js";
import type { SetLabProcedureActiveController } from "../../interface/http/controllers/SetLabProcedureActiveController.js";
import type { UpdateLabProcedureController } from "../../interface/http/controllers/UpdateLabProcedureController.js";
import type { CreatePromotionController } from "../../interface/http/controllers/CreatePromotionController.js";
import type { GetPromotionController } from "../../interface/http/controllers/GetPromotionController.js";
import type { ListPromotionsController } from "../../interface/http/controllers/ListPromotionsController.js";
import type { SetPromotionActiveController } from "../../interface/http/controllers/SetPromotionActiveController.js";
import type { UpdatePromotionController } from "../../interface/http/controllers/UpdatePromotionController.js";
import type { AddClosedDayController } from "../../interface/http/controllers/AddClosedDayController.js";
import type { GetSystemSettingsController } from "../../interface/http/controllers/GetSystemSettingsController.js";
import type { ListClosedDaysController } from "../../interface/http/controllers/ListClosedDaysController.js";
import type { RemoveClosedDayController } from "../../interface/http/controllers/RemoveClosedDayController.js";
import type { UpdateClosedDayController } from "../../interface/http/controllers/UpdateClosedDayController.js";
import type { UpdateSystemSettingsController } from "../../interface/http/controllers/UpdateSystemSettingsController.js";
import type { CopyPreviousRostersController } from "../../interface/http/controllers/CopyPreviousRostersController.js";
import type { CreateTeamController } from "../../interface/http/controllers/CreateTeamController.js";
import type { ListStaffController } from "../../interface/http/controllers/ListStaffController.js";
import type { ListTeamsController } from "../../interface/http/controllers/ListTeamsController.js";
import type { SaveRosterController } from "../../interface/http/controllers/SaveRosterController.js";
import type { SetTeamActiveController } from "../../interface/http/controllers/SetTeamActiveController.js";
import type { UpdateTeamController } from "../../interface/http/controllers/UpdateTeamController.js";
import type { GetMyScheduleController } from "../../interface/http/controllers/GetMyScheduleController.js";
import type { GetShiftBoardController } from "../../interface/http/controllers/GetShiftBoardController.js";
import type { SetShiftDaysController } from "../../interface/http/controllers/SetShiftDaysController.js";
import type { CancelLeaveController } from "../../interface/http/controllers/CancelLeaveController.js";
import type { DecideLeaveController } from "../../interface/http/controllers/DecideLeaveController.js";
import type { ListAllLeaveController } from "../../interface/http/controllers/ListAllLeaveController.js";
import type { ListLeaveInboxController } from "../../interface/http/controllers/ListLeaveInboxController.js";
import type { ListMyLeaveController } from "../../interface/http/controllers/ListMyLeaveController.js";
import type { RequestLeaveController } from "../../interface/http/controllers/RequestLeaveController.js";
import type { Controller, Middleware } from "../../interface/http/httpTypes.js";
import { RequirePermission } from "../../interface/http/middleware/RequirePermission.js";
import { adapt } from "./expressAdapter.js";
import { uploadAttachment, uploadPhoto } from "./uploadPhoto.js";

/** The concrete controller behind each route (any of them may be wrapped, e.g. audited). */
interface ControllerTypes {
  health: HealthController;
  registerPatient: RegisterPatientController;
  login: LoginController;
  logout: LogoutController;
  getCurrentUser: GetCurrentUserController;
  changePassword: ChangePasswordController;
  getProfile: GetProfileController;
  updateProfile: UpdateProfileController;
  setProfilePhoto: SetProfilePhotoController;
  removeProfilePhoto: RemoveProfilePhotoController;
  listUsers: ListUsersController;
  createStaffAccount: CreateStaffAccountController;
  setUserActive: SetUserActiveController;
  reissueTemporaryPassword: ReissueTemporaryPasswordController;
  listRoles: ListRolesController;
  getCustomRole: GetCustomRoleController;
  createCustomRole: CreateCustomRoleController;
  updateCustomRole: UpdateCustomRoleController;
  deleteCustomRole: DeleteCustomRoleController;
  assignCustomRole: AssignCustomRoleController;
  listProcedureCategories: ListProcedureCategoriesController;
  createProcedureCategory: CreateProcedureCategoryController;
  renameProcedureCategory: RenameProcedureCategoryController;
  deleteProcedureCategory: DeleteProcedureCategoryController;
  listLabProcedures: ListLabProceduresController;
  getLabProcedure: GetLabProcedureController;
  createLabProcedure: CreateLabProcedureController;
  updateLabProcedure: UpdateLabProcedureController;
  setLabProcedureActive: SetLabProcedureActiveController;
  listPromotions: ListPromotionsController;
  getPromotion: GetPromotionController;
  createPromotion: CreatePromotionController;
  updatePromotion: UpdatePromotionController;
  setPromotionActive: SetPromotionActiveController;
  getSystemSettings: GetSystemSettingsController;
  updateSystemSettings: UpdateSystemSettingsController;
  listClosedDays: ListClosedDaysController;
  addClosedDay: AddClosedDayController;
  updateClosedDay: UpdateClosedDayController;
  removeClosedDay: RemoveClosedDayController;
  listTeams: ListTeamsController;
  createTeam: CreateTeamController;
  updateTeam: UpdateTeamController;
  setTeamActive: SetTeamActiveController;
  saveRoster: SaveRosterController;
  copyPreviousRosters: CopyPreviousRostersController;
  listStaff: ListStaffController;
  getMySchedule: GetMyScheduleController;
  getShiftBoard: GetShiftBoardController;
  setShiftDays: SetShiftDaysController;
  requestLeave: RequestLeaveController;
  listMyLeave: ListMyLeaveController;
  cancelLeave: CancelLeaveController;
  listLeaveInbox: ListLeaveInboxController;
  decideLeave: DecideLeaveController;
  listAllLeave: ListAllLeaveController;
  getAvailability: GetAvailabilityController;
  quoteBooking: QuoteBookingController;
  bookAppointment: BookAppointmentController;
  listMyAppointments: ListMyAppointmentsController;
  getAppointment: GetAppointmentController;
  cancelAppointment: CancelAppointmentController;
  listAppointments: ListAppointmentsController;
  acceptAppointment: DecideAppointmentController;
  rejectAppointment: DecideAppointmentController;
  proposeNewTime: ProposeNewTimeController;
  answerProposal: AnswerProposalController;
  listTeamChoices: ListTeamChoicesController;
  assignTeam: AssignTeamController;
  listMyVisits: ListMyVisitsController;
  recordVisit: RecordVisitController;
  listNotes: ListAppointmentNotesController;
  addNote: AddAppointmentNoteController;
  deleteAttachment: DeleteAttachmentController;
  scheduleReturnVisit: ScheduleReturnVisitController;
  listRouteTeams: ListRouteTeamsController;
  getDailyRoute: GetDailyRouteController;
  reorderRoute: ReorderRouteController;
  startCardPayment: StartCardPaymentController;
  recordCashPayment: RecordCashPaymentController;
  paymentWebhook: HandlePaymentWebhookController;
  refundPayment: RefundPaymentController;
  listPayments: ListPaymentsController;
  exportPayments: ExportPaymentsController;
  listMyPayments: ListMyPaymentsController;
  listAppointmentPayments: ListAppointmentPaymentsController;
  getAppointmentResults: GetAppointmentResultsController;
  uploadTestResult: UploadTestResultController;
  deleteTestResult: DeleteTestResultController;
  releaseResults: ReleaseResultsController;
  openResultFile: OpenResultFileController;
  listReviewQueue: ListReviewQueueController;
  listMyResults: ListMyResultsController;
  listAuditLog: ListAuditLogController;
  getDashboard: GetDashboardController;
  runReport: RunReportController;
  exportReport: RunReportController;
  listSavedReports: ListSavedReportsController;
  saveReport: SaveReportController;
  deleteSavedReport: DeleteSavedReportController;
  openTicket: OpenTicketController;
  listMyTickets: ListMyTicketsController;
  listTicketQueue: ListTicketQueueController;
  getTicket: GetTicketController;
  postTicketMessage: PostTicketMessageController;
  openMessageAttachment: OpenMessageAttachmentController;
  listSupportAgents: ListSupportAgentsController;
  claimTicket: ClaimTicketController;
  reassignTicket: ReassignTicketController;
  setTicketPriority: SetTicketPriorityController;
  closeTicket: CloseTicketController;
  rateTicket: RateTicketController;
  requestPasswordReset: RequestPasswordResetController;
  resetPassword: ResetPasswordController;
  getAppointmentReview: GetAppointmentReviewController;
  reviewAppointment: ReviewAppointmentController;
  updateUser: UpdateUserController;
  exportUsers: ExportUsersController;
  getUserPermissions: GetUserPermissionsController;
  setUserOverrides: SetUserOverridesController;
  listNotifications: ListNotificationsController;
  markNotificationRead: MarkNotificationReadController;
  markAllNotificationsRead: MarkAllNotificationsReadController;
}

export type Controllers = Record<keyof ControllerTypes, Controller>;

export interface Middlewares {
  /** Signed in with a permanent password. Use this for almost every route. */
  authenticate: Middleware;
  /** Signed in, possibly still on a temporary password. Only for /me, /password and /logout. */
  authenticateAllowingPasswordChange: Middleware;
}

/** Slows down password guessing: 10 failed attempts per IP per 15 minutes. */
function passwordRateLimit() {
  return rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: "too_many_requests", message: "Too many attempts. Try again later." },
      });
    },
  });
}

/** Limits "Forgot password?" emails: 5 per IP per 15 minutes, answered or not. */
function resetEmailRateLimit() {
  return rateLimit({
    windowMs: 15 * 60_000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: "too_many_requests", message: "Too many attempts. Try again later." },
      });
    },
  });
}

export function createRouter(controllers: Controllers, middlewares: Middlewares): Router {
  const router = Router();
  router.get("/health", adapt(controllers.health));

  router.post("/auth/register", adapt(controllers.registerPatient));
  router.post("/auth/login", passwordRateLimit(), adapt(controllers.login));
  router.post(
    "/auth/forgot-password",
    resetEmailRateLimit(),
    adapt(controllers.requestPasswordReset),
  );
  router.post("/auth/reset-password", passwordRateLimit(), adapt(controllers.resetPassword));
  router.post(
    "/auth/logout",
    adapt(controllers.logout, middlewares.authenticateAllowingPasswordChange),
  );
  router.get(
    "/auth/me",
    adapt(controllers.getCurrentUser, middlewares.authenticateAllowingPasswordChange),
  );
  router.put(
    "/auth/password",
    passwordRateLimit(),
    adapt(controllers.changePassword, middlewares.authenticateAllowingPasswordChange),
  );

  router.get("/users/me/profile", adapt(controllers.getProfile, middlewares.authenticate));
  router.patch("/users/me/profile", adapt(controllers.updateProfile, middlewares.authenticate));
  router.put(
    "/users/me/photo",
    uploadPhoto,
    adapt(controllers.setProfilePhoto, middlewares.authenticate),
  );
  router.delete("/users/me/photo", adapt(controllers.removeProfilePhoto, middlewares.authenticate));

  const can = (permission: ConstructorParameters<typeof RequirePermission>[0]) => [
    middlewares.authenticate,
    new RequirePermission(permission),
  ];
  router.get("/users", adapt(controllers.listUsers, ...can("users.view")));
  router.get("/users/export", adapt(controllers.exportUsers, ...can("users.export")));
  router.patch("/users/:id", adapt(controllers.updateUser, ...can("users.update")));
  router.get(
    "/users/:id/permissions",
    adapt(controllers.getUserPermissions, ...can("permissions.view")),
  );
  router.put(
    "/users/:id/permissions",
    adapt(controllers.setUserOverrides, ...can("permissions.override")),
  );
  router.post("/users/staff", adapt(controllers.createStaffAccount, ...can("users.create")));
  router.patch("/users/:id/status", adapt(controllers.setUserActive, ...can("users.deactivate")));
  router.post(
    "/users/:id/temporary-password",
    adapt(controllers.reissueTemporaryPassword, ...can("users.reset_password")),
  );

  router.put("/users/:id/role", adapt(controllers.assignCustomRole, ...can("roles.assign")));

  router.get("/roles", adapt(controllers.listRoles, ...can("roles.view")));
  router.get("/roles/:id", adapt(controllers.getCustomRole, ...can("roles.view")));
  router.post("/roles", adapt(controllers.createCustomRole, ...can("roles.manage")));
  router.put("/roles/:id", adapt(controllers.updateCustomRole, ...can("roles.manage")));
  router.delete("/roles/:id", adapt(controllers.deleteCustomRole, ...can("roles.manage")));

  // Anyone with procedures.view reads the catalogue; only managers see inactive procedures.
  router.get(
    "/catalog/categories",
    adapt(controllers.listProcedureCategories, ...can("procedures.view")),
  );
  router.post(
    "/catalog/categories",
    adapt(controllers.createProcedureCategory, ...can("procedures.manage")),
  );
  router.put(
    "/catalog/categories/:id",
    adapt(controllers.renameProcedureCategory, ...can("procedures.manage")),
  );
  router.delete(
    "/catalog/categories/:id",
    adapt(controllers.deleteProcedureCategory, ...can("procedures.manage")),
  );
  router.get(
    "/catalog/procedures",
    adapt(controllers.listLabProcedures, ...can("procedures.view")),
  );
  router.get(
    "/catalog/procedures/:id",
    adapt(controllers.getLabProcedure, ...can("procedures.view")),
  );
  router.post(
    "/catalog/procedures",
    adapt(controllers.createLabProcedure, ...can("procedures.manage")),
  );
  router.put(
    "/catalog/procedures/:id",
    adapt(controllers.updateLabProcedure, ...can("procedures.manage")),
  );
  router.patch(
    "/catalog/procedures/:id/status",
    adapt(controllers.setLabProcedureActive, ...can("procedures.manage")),
  );

  // Viewers see running promotions only; managers see every status.
  router.get("/catalog/promotions", adapt(controllers.listPromotions, ...can("promotions.view")));
  router.get("/catalog/promotions/:id", adapt(controllers.getPromotion, ...can("promotions.view")));
  router.post(
    "/catalog/promotions",
    adapt(controllers.createPromotion, ...can("promotions.manage")),
  );
  router.put(
    "/catalog/promotions/:id",
    adapt(controllers.updatePromotion, ...can("promotions.manage")),
  );
  router.patch(
    "/catalog/promotions/:id/status",
    adapt(controllers.setPromotionActive, ...can("promotions.manage")),
  );

  router.get("/settings", adapt(controllers.getSystemSettings, ...can("settings.view")));
  router.put("/settings", adapt(controllers.updateSystemSettings, ...can("settings.manage")));

  router.get("/holidays", adapt(controllers.listClosedDays, ...can("holidays.view")));
  router.post("/holidays", adapt(controllers.addClosedDay, ...can("holidays.manage")));
  router.put("/holidays/:id", adapt(controllers.updateClosedDay, ...can("holidays.manage")));
  router.delete("/holidays/:id", adapt(controllers.removeClosedDay, ...can("holidays.manage")));

  router.get("/teams", adapt(controllers.listTeams, ...can("teams.view")));
  router.post("/teams", adapt(controllers.createTeam, ...can("teams.manage")));
  router.put("/teams/:id", adapt(controllers.updateTeam, ...can("teams.manage")));
  router.patch("/teams/:id/status", adapt(controllers.setTeamActive, ...can("teams.manage")));
  router.put(
    "/teams/:id/rosters/:periodStart",
    adapt(controllers.saveRoster, ...can("teams.roster")),
  );
  router.post(
    "/rosters/:periodStart/copy-previous",
    adapt(controllers.copyPreviousRosters, ...can("teams.roster")),
  );
  router.get("/staff", adapt(controllers.listStaff, ...can("teams.roster")));

  router.get("/shifts/mine", adapt(controllers.getMySchedule, ...can("shifts.view_own")));
  router.get("/shifts", adapt(controllers.getShiftBoard, ...can("shifts.view")));
  router.put("/shifts/:userId/days", adapt(controllers.setShiftDays, ...can("shifts.manage")));

  router.post("/leave", adapt(controllers.requestLeave, ...can("leave.request")));
  router.get("/leave/mine", adapt(controllers.listMyLeave, ...can("leave.request")));
  router.patch("/leave/:id/cancel", adapt(controllers.cancelLeave, ...can("leave.request")));
  // Team leads decide their team's first step without leave.approve, so the
  // domain (canDecide) guards these two instead of a permission.
  router.get("/leave/inbox", adapt(controllers.listLeaveInbox, middlewares.authenticate));
  router.post("/leave/:id/decision", adapt(controllers.decideLeave, middlewares.authenticate));
  router.get("/leave", adapt(controllers.listAllLeave, ...can("leave.view")));

  // Open places only, so any signed-in user may look: patients booking, staff proposing a
  // new time, the med team booking a return visit
  router.get(
    "/appointments/availability",
    adapt(controllers.getAvailability, middlewares.authenticate),
  );
  router.get("/appointments/quote", adapt(controllers.quoteBooking, ...can("appointments.book")));
  router.post("/appointments", adapt(controllers.bookAppointment, ...can("appointments.book")));
  router.get(
    "/appointments/mine",
    adapt(controllers.listMyAppointments, ...can("appointments.view_own")),
  );
  router.get("/appointments", adapt(controllers.listAppointments, ...can("appointments.view_all")));
  // Patients see their own, staff with appointments.view_all any: the use case decides (404 otherwise).
  router.get("/appointments/:id", adapt(controllers.getAppointment, middlewares.authenticate));
  router.patch(
    "/appointments/:id/cancel",
    adapt(controllers.cancelAppointment, ...can("appointments.cancel")),
  );
  router.post(
    "/appointments/:id/accept",
    adapt(controllers.acceptAppointment, ...can("appointments.accept")),
  );
  router.post(
    "/appointments/:id/reject",
    adapt(controllers.rejectAppointment, ...can("appointments.reject")),
  );
  router.post(
    "/appointments/:id/reschedule",
    adapt(controllers.proposeNewTime, ...can("appointments.reschedule")),
  );
  router.get(
    "/appointments/:id/teams",
    adapt(controllers.listTeamChoices, ...can("appointments.assign")),
  );
  router.put(
    "/appointments/:id/team",
    adapt(controllers.assignTeam, ...can("appointments.assign")),
  );
  router.get("/visits/mine", adapt(controllers.listMyVisits, ...can("visits.view_assigned")));
  router.post("/visits/:id", adapt(controllers.recordVisit, ...can("visits.collect")));
  // Notes: patients read the shared ones; the use case checks who may see the appointment
  router.get("/appointments/:id/notes", adapt(controllers.listNotes, middlewares.authenticate));
  router.post(
    "/appointments/:id/notes",
    uploadAttachment,
    adapt(controllers.addNote, ...can("notes.create")),
  );
  router.delete(
    "/appointments/:id/attachments/:attachmentId",
    adapt(controllers.deleteAttachment, ...can("notes.attach")),
  );
  // The visit's team (visits.schedule_return) or staff (appointments.assign): the use case decides
  router.post(
    "/appointments/:id/return",
    adapt(controllers.scheduleReturnVisit, middlewares.authenticate),
  );
  router.get("/routes/teams", adapt(controllers.listRouteTeams, ...can("routes.view")));
  router.get("/routes", adapt(controllers.getDailyRoute, ...can("routes.view")));
  router.put("/routes", adapt(controllers.reorderRoute, ...can("routes.manage")));
  router.post(
    "/appointments/:id/proposal",
    adapt(controllers.answerProposal, ...can("appointments.view_own")),
  );
  // Payments (the Stripe webhook is mounted in app.ts: it needs the raw body)
  // Anyone who may open the appointment: the use case decides (404 otherwise)
  router.get(
    "/appointments/:id/payments",
    adapt(controllers.listAppointmentPayments, middlewares.authenticate),
  );
  router.post(
    "/appointments/:id/checkout",
    adapt(controllers.startCardPayment, ...can("payments.pay")),
  );
  router.post(
    "/appointments/:id/cash",
    adapt(controllers.recordCashPayment, ...can("payments.record_cash")),
  );
  router.get("/payments/mine", adapt(controllers.listMyPayments, ...can("payments.view_own")));
  router.get("/payments/export", adapt(controllers.exportPayments, ...can("payments.export")));
  router.get("/payments", adapt(controllers.listPayments, ...can("payments.view_all")));
  router.post("/payments/:id/refunds", adapt(controllers.refundPayment, ...can("payments.refund")));
  // Results: anyone who may open the appointment reads them; the use cases decide how much
  router.get(
    "/appointments/:id/results",
    adapt(controllers.getAppointmentResults, middlewares.authenticate),
  );
  router.post(
    "/appointments/:id/results/release",
    adapt(controllers.releaseResults, ...can("results.release")),
  );
  router.post(
    "/appointments/:id/results/:procedureId",
    uploadAttachment,
    adapt(controllers.uploadTestResult, ...can("results.upload")),
  );
  router.delete(
    "/appointments/:id/results/:procedureId",
    adapt(controllers.deleteTestResult, ...can("results.upload")),
  );
  router.get("/results/queue", adapt(controllers.listReviewQueue, ...can("results.review")));
  router.get("/results/mine", adapt(controllers.listMyResults, ...can("results.view_own")));
  router.get("/audit", adapt(controllers.listAuditLog, ...can("audit.view")));
  router.get("/dashboard", adapt(controllers.getDashboard, ...can("dashboard.view")));
  // Saved reports first, so "saved" isn't read as a report kind
  router.get("/reports/saved", adapt(controllers.listSavedReports, ...can("reports.view")));
  router.post("/reports/saved", adapt(controllers.saveReport, ...can("reports.save")));
  router.delete("/reports/saved/:id", adapt(controllers.deleteSavedReport, ...can("reports.save")));
  router.get("/reports/:kind/export", adapt(controllers.exportReport, ...can("reports.export")));
  router.get("/reports/:kind", adapt(controllers.runReport, ...can("reports.view")));
  router.get("/results/:id/file", adapt(controllers.openResultFile, middlewares.authenticate));

  // Support desk: "mine" and "agents" before :id; the use cases check who may see a ticket
  router.post(
    "/support/tickets",
    uploadAttachment,
    adapt(controllers.openTicket, ...can("support.create_ticket")),
  );
  router.get("/support/tickets/mine", adapt(controllers.listMyTickets, ...can("support.view_own")));
  router.get("/support/tickets", adapt(controllers.listTicketQueue, ...can("support.view_queue")));
  router.get("/support/agents", adapt(controllers.listSupportAgents, ...can("support.assign")));
  router.get("/support/tickets/:id", adapt(controllers.getTicket, middlewares.authenticate));
  router.post(
    "/support/tickets/:id/messages",
    uploadAttachment,
    adapt(controllers.postTicketMessage, ...can("chat.use")),
  );
  router.get(
    "/support/messages/:id/attachment",
    adapt(controllers.openMessageAttachment, middlewares.authenticate),
  );
  router.post(
    "/support/tickets/:id/claim",
    adapt(controllers.claimTicket, ...can("support.handle")),
  );
  router.patch(
    "/support/tickets/:id/assignee",
    adapt(controllers.reassignTicket, ...can("support.assign")),
  );
  router.patch(
    "/support/tickets/:id/priority",
    adapt(controllers.setTicketPriority, ...can("support.handle")),
  );
  router.post(
    "/support/tickets/:id/close",
    adapt(controllers.closeTicket, middlewares.authenticate),
  );
  router.post(
    "/support/tickets/:id/rating",
    adapt(controllers.rateTicket, middlewares.authenticate),
  );

  // Notifications: everyone has their own
  router.get("/notifications", adapt(controllers.listNotifications, middlewares.authenticate));
  router.post(
    "/notifications/read-all",
    adapt(controllers.markAllNotificationsRead, middlewares.authenticate),
  );
  router.post(
    "/notifications/:id/read",
    adapt(controllers.markNotificationRead, middlewares.authenticate),
  );

  router.get(
    "/appointments/:id/review",
    adapt(controllers.getAppointmentReview, middlewares.authenticate),
  );
  router.post(
    "/appointments/:id/review",
    adapt(controllers.reviewAppointment, ...can("appointments.review")),
  );

  return router;
}
