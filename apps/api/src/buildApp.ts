import { AssignCustomRole } from "./application/access/AssignCustomRole.js";
import { CreateCustomRole } from "./application/access/CreateCustomRole.js";
import { DeleteCustomRole } from "./application/access/DeleteCustomRole.js";
import { GetCustomRole } from "./application/access/GetCustomRole.js";
import { ListRoles } from "./application/access/ListRoles.js";
import { UpdateCustomRole } from "./application/access/UpdateCustomRole.js";
import { AuthenticateRequest } from "./application/identity/AuthenticateRequest.js";
import { ChangePassword } from "./application/identity/ChangePassword.js";
import { CheckSystemHealth } from "./application/health/CheckSystemHealth.js";
import { CreateStaffAccount } from "./application/identity/CreateStaffAccount.js";
import { GetCurrentUser } from "./application/identity/GetCurrentUser.js";
import { GetProfile } from "./application/identity/GetProfile.js";
import { ListUsers } from "./application/identity/ListUsers.js";
import { Login } from "./application/identity/Login.js";
import { RegisterPatient } from "./application/identity/RegisterPatient.js";
import { ResolvePermissions } from "./application/access/ResolvePermissions.js";
import { ReissueTemporaryPassword } from "./application/identity/ReissueTemporaryPassword.js";
import { SetUserActive } from "./application/identity/SetUserActive.js";
import { UpdateProfile } from "./application/identity/UpdateProfile.js";
import { CreateLabProcedure } from "./application/catalog/CreateLabProcedure.js";
import { CreateProcedureCategory } from "./application/catalog/CreateProcedureCategory.js";
import { DeleteProcedureCategory } from "./application/catalog/DeleteProcedureCategory.js";
import { GetLabProcedure } from "./application/catalog/GetLabProcedure.js";
import { ListLabProcedures } from "./application/catalog/ListLabProcedures.js";
import { ListProcedureCategories } from "./application/catalog/ListProcedureCategories.js";
import { RenameProcedureCategory } from "./application/catalog/RenameProcedureCategory.js";
import { SetLabProcedureActive } from "./application/catalog/SetLabProcedureActive.js";
import { UpdateLabProcedure } from "./application/catalog/UpdateLabProcedure.js";
import { CreatePromotion } from "./application/catalog/CreatePromotion.js";
import { GetPromotion } from "./application/catalog/GetPromotion.js";
import { ListPromotions } from "./application/catalog/ListPromotions.js";
import { SetPromotionActive } from "./application/catalog/SetPromotionActive.js";
import { UpdatePromotion } from "./application/catalog/UpdatePromotion.js";
import { AddClosedDay } from "./application/settings/AddClosedDay.js";
import { GetSystemSettings } from "./application/settings/GetSystemSettings.js";
import { ListClosedDays } from "./application/settings/ListClosedDays.js";
import { RemoveClosedDay } from "./application/settings/RemoveClosedDay.js";
import { UpdateClosedDay } from "./application/settings/UpdateClosedDay.js";
import { UpdateSystemSettings } from "./application/settings/UpdateSystemSettings.js";
import { CopyPreviousRosters } from "./application/scheduling/CopyPreviousRosters.js";
import { CreateTeam } from "./application/scheduling/CreateTeam.js";
import { ListStaff } from "./application/scheduling/ListStaff.js";
import { ListTeams } from "./application/scheduling/ListTeams.js";
import { SaveRoster } from "./application/scheduling/SaveRoster.js";
import { SetTeamActive } from "./application/scheduling/SetTeamActive.js";
import { UpdateTeam } from "./application/scheduling/UpdateTeam.js";
import { GetMySchedule } from "./application/scheduling/GetMySchedule.js";
import { GetShiftBoard } from "./application/scheduling/GetShiftBoard.js";
import { SetShiftDays } from "./application/scheduling/SetShiftDays.js";
import { CancelLeave } from "./application/scheduling/CancelLeave.js";
import { DecideLeave } from "./application/scheduling/DecideLeave.js";
import { ListAllLeave } from "./application/scheduling/ListAllLeave.js";
import { ListLeaveInbox } from "./application/scheduling/ListLeaveInbox.js";
import { ListMyLeave } from "./application/scheduling/ListMyLeave.js";
import { RequestLeave } from "./application/scheduling/RequestLeave.js";
import { DrizzleAccessRepository } from "./infrastructure/db/DrizzleAccessRepository.js";
import { DrizzleRoleRepository } from "./infrastructure/db/DrizzleRoleRepository.js";
import { DrizzleDatabaseHealthProbe } from "./infrastructure/db/DrizzleDatabaseHealthProbe.js";
import { DrizzleSessionRepository } from "./infrastructure/db/DrizzleSessionRepository.js";
import { DrizzleUserRepository } from "./infrastructure/db/DrizzleUserRepository.js";
import { DrizzleLabProcedureRepository } from "./infrastructure/db/DrizzleLabProcedureRepository.js";
import { DrizzleProcedureCategoryRepository } from "./infrastructure/db/DrizzleProcedureCategoryRepository.js";
import { DrizzlePromotionRepository } from "./infrastructure/db/DrizzlePromotionRepository.js";
import { DrizzleClosedDayRepository } from "./infrastructure/db/DrizzleClosedDayRepository.js";
import { DrizzleSettingsRepository } from "./infrastructure/db/DrizzleSettingsRepository.js";
import { DrizzleMedTeamRepository } from "./infrastructure/db/DrizzleMedTeamRepository.js";
import { DrizzleStaffDirectory } from "./infrastructure/db/DrizzleStaffDirectory.js";
import { DrizzleShiftRepository } from "./infrastructure/db/DrizzleShiftRepository.js";
import { DrizzleLeaveRepository } from "./infrastructure/db/DrizzleLeaveRepository.js";
import { createApp } from "./infrastructure/http/app.js";
import { AssignCustomRoleController } from "./interface/http/controllers/AssignCustomRoleController.js";
import { CreateCustomRoleController } from "./interface/http/controllers/CreateCustomRoleController.js";
import { DeleteCustomRoleController } from "./interface/http/controllers/DeleteCustomRoleController.js";
import { GetCustomRoleController } from "./interface/http/controllers/GetCustomRoleController.js";
import { ListRolesController } from "./interface/http/controllers/ListRolesController.js";
import { UpdateCustomRoleController } from "./interface/http/controllers/UpdateCustomRoleController.js";
import { ChangePasswordController } from "./interface/http/controllers/ChangePasswordController.js";
import { CreateStaffAccountController } from "./interface/http/controllers/CreateStaffAccountController.js";
import { GetCurrentUserController } from "./interface/http/controllers/GetCurrentUserController.js";
import { GetProfileController } from "./interface/http/controllers/GetProfileController.js";
import { HealthController } from "./interface/http/controllers/HealthController.js";
import { ListUsersController } from "./interface/http/controllers/ListUsersController.js";
import { LoginController } from "./interface/http/controllers/LoginController.js";
import { LogoutController } from "./interface/http/controllers/LogoutController.js";
import { RegisterPatientController } from "./interface/http/controllers/RegisterPatientController.js";
import { ReissueTemporaryPasswordController } from "./interface/http/controllers/ReissueTemporaryPasswordController.js";
import { SetUserActiveController } from "./interface/http/controllers/SetUserActiveController.js";
import { UpdateProfileController } from "./interface/http/controllers/UpdateProfileController.js";
import { CreateLabProcedureController } from "./interface/http/controllers/CreateLabProcedureController.js";
import { CreateProcedureCategoryController } from "./interface/http/controllers/CreateProcedureCategoryController.js";
import { DeleteProcedureCategoryController } from "./interface/http/controllers/DeleteProcedureCategoryController.js";
import { GetLabProcedureController } from "./interface/http/controllers/GetLabProcedureController.js";
import { ListLabProceduresController } from "./interface/http/controllers/ListLabProceduresController.js";
import { ListProcedureCategoriesController } from "./interface/http/controllers/ListProcedureCategoriesController.js";
import { RenameProcedureCategoryController } from "./interface/http/controllers/RenameProcedureCategoryController.js";
import { SetLabProcedureActiveController } from "./interface/http/controllers/SetLabProcedureActiveController.js";
import { UpdateLabProcedureController } from "./interface/http/controllers/UpdateLabProcedureController.js";
import { CreatePromotionController } from "./interface/http/controllers/CreatePromotionController.js";
import { GetPromotionController } from "./interface/http/controllers/GetPromotionController.js";
import { ListPromotionsController } from "./interface/http/controllers/ListPromotionsController.js";
import { SetPromotionActiveController } from "./interface/http/controllers/SetPromotionActiveController.js";
import { UpdatePromotionController } from "./interface/http/controllers/UpdatePromotionController.js";
import { AddClosedDayController } from "./interface/http/controllers/AddClosedDayController.js";
import { GetSystemSettingsController } from "./interface/http/controllers/GetSystemSettingsController.js";
import { ListClosedDaysController } from "./interface/http/controllers/ListClosedDaysController.js";
import { RemoveClosedDayController } from "./interface/http/controllers/RemoveClosedDayController.js";
import { UpdateClosedDayController } from "./interface/http/controllers/UpdateClosedDayController.js";
import { UpdateSystemSettingsController } from "./interface/http/controllers/UpdateSystemSettingsController.js";
import { CopyPreviousRostersController } from "./interface/http/controllers/CopyPreviousRostersController.js";
import { CreateTeamController } from "./interface/http/controllers/CreateTeamController.js";
import { ListStaffController } from "./interface/http/controllers/ListStaffController.js";
import { ListTeamsController } from "./interface/http/controllers/ListTeamsController.js";
import { SaveRosterController } from "./interface/http/controllers/SaveRosterController.js";
import { SetTeamActiveController } from "./interface/http/controllers/SetTeamActiveController.js";
import { UpdateTeamController } from "./interface/http/controllers/UpdateTeamController.js";
import { GetMyScheduleController } from "./interface/http/controllers/GetMyScheduleController.js";
import { GetShiftBoardController } from "./interface/http/controllers/GetShiftBoardController.js";
import { SetShiftDaysController } from "./interface/http/controllers/SetShiftDaysController.js";
import { CancelLeaveController } from "./interface/http/controllers/CancelLeaveController.js";
import { DecideLeaveController } from "./interface/http/controllers/DecideLeaveController.js";
import { ListAllLeaveController } from "./interface/http/controllers/ListAllLeaveController.js";
import { ListLeaveInboxController } from "./interface/http/controllers/ListLeaveInboxController.js";
import { ListMyLeaveController } from "./interface/http/controllers/ListMyLeaveController.js";
import { RequestLeaveController } from "./interface/http/controllers/RequestLeaveController.js";
import { Authenticate } from "./interface/http/middleware/Authenticate.js";
import type { AccountEmails } from "./application/ports/AccountEmails.js";
import type { Clock } from "./application/ports/Clock.js";
import type { DatabaseHealthProbe } from "./application/ports/DatabaseHealthProbe.js";
import type { PasswordHasher } from "./application/ports/PasswordHasher.js";
import type { PhotoStorage } from "./application/ports/PhotoStorage.js";
import type { FileStorage } from "./application/ports/FileStorage.js";
import {
  AddAppointmentNote,
  DeleteAttachment,
  ListAppointmentNotes,
} from "./application/appointments/AppointmentNotes.js";
import {
  GetDailyRoute,
  ListRouteTeams,
  ReorderRoute,
} from "./application/appointments/DailyRoute.js";
import { ScheduleReturnVisit } from "./application/appointments/ScheduleReturnVisit.js";
import { DrizzleAppointmentNoteRepository } from "./infrastructure/db/DrizzleAppointmentNoteRepository.js";
import { ListAppointmentNotesController } from "./interface/http/controllers/ListAppointmentNotesController.js";
import { AddAppointmentNoteController } from "./interface/http/controllers/AddAppointmentNoteController.js";
import { DeleteAttachmentController } from "./interface/http/controllers/DeleteAttachmentController.js";
import { ScheduleReturnVisitController } from "./interface/http/controllers/ScheduleReturnVisitController.js";
import { ListRouteTeamsController } from "./interface/http/controllers/ListRouteTeamsController.js";
import { GetDailyRouteController } from "./interface/http/controllers/GetDailyRouteController.js";
import { ReorderRouteController } from "./interface/http/controllers/ReorderRouteController.js";
import { RemoveProfilePhoto } from "./application/identity/RemoveProfilePhoto.js";
import { SetProfilePhoto } from "./application/identity/SetProfilePhoto.js";
import { RemoveProfilePhotoController } from "./interface/http/controllers/RemoveProfilePhotoController.js";
import { SetProfilePhotoController } from "./interface/http/controllers/SetProfilePhotoController.js";
import type { TemporaryPasswordGenerator } from "./application/ports/TemporaryPasswordGenerator.js";
import type { Pool } from "pg";
import type { Database } from "./infrastructure/db/client.js";
import type { AppointmentEmails } from "./application/ports/AppointmentEmails.js";
import { DrizzleAppointmentRepository } from "./infrastructure/db/DrizzleAppointmentRepository.js";
import { AssignTeam, ListTeamChoices } from "./application/appointments/AssignTeam.js";
import { ListMyVisits } from "./application/appointments/ListMyVisits.js";
import { RecordVisit } from "./application/appointments/RecordVisit.js";
import { AssignTeamController } from "./interface/http/controllers/AssignTeamController.js";
import { ListMyVisitsController } from "./interface/http/controllers/ListMyVisitsController.js";
import { ListTeamChoicesController } from "./interface/http/controllers/ListTeamChoicesController.js";
import { RecordVisitController } from "./interface/http/controllers/RecordVisitController.js";
import { GetAvailability } from "./application/appointments/GetAvailability.js";
import { GetAvailabilityController } from "./interface/http/controllers/GetAvailabilityController.js";
import { QuoteBooking } from "./application/appointments/QuoteBooking.js";
import { QuoteBookingController } from "./interface/http/controllers/QuoteBookingController.js";
import { BookAppointment } from "./application/appointments/BookAppointment.js";
import { BookAppointmentController } from "./interface/http/controllers/BookAppointmentController.js";
import { ListMyAppointments } from "./application/appointments/ListMyAppointments.js";
import { ListMyAppointmentsController } from "./interface/http/controllers/ListMyAppointmentsController.js";
import { GetAppointment } from "./application/appointments/GetAppointment.js";
import { GetAppointmentController } from "./interface/http/controllers/GetAppointmentController.js";
import { CancelAppointment } from "./application/appointments/CancelAppointment.js";
import { CancelAppointmentController } from "./interface/http/controllers/CancelAppointmentController.js";
import { ListAppointments } from "./application/appointments/ListAppointments.js";
import { ListAppointmentsController } from "./interface/http/controllers/ListAppointmentsController.js";
import { DecideAppointment } from "./application/appointments/DecideAppointment.js";
import { DecideAppointmentController } from "./interface/http/controllers/DecideAppointmentController.js";
import { ProposeNewTime } from "./application/appointments/ProposeNewTime.js";
import { ProposeNewTimeController } from "./interface/http/controllers/ProposeNewTimeController.js";
import { AnswerProposal } from "./application/appointments/AnswerProposal.js";
import { AnswerProposalController } from "./interface/http/controllers/AnswerProposalController.js";
import { createSessionMiddleware } from "./infrastructure/http/session.js";
import type { PrivateFileStorage } from "./application/ports/PrivateFileStorage.js";
import { DrizzleResultRepository } from "./infrastructure/db/DrizzleResultRepository.js";
import { DeleteTestResult } from "./application/results/DeleteTestResult.js";
import { GetAppointmentResults } from "./application/results/GetAppointmentResults.js";
import { ListMyResults, ListReviewQueue } from "./application/results/ListReviewQueue.js";
import { OpenResultFile } from "./application/results/OpenResultFile.js";
import { ReleaseResults } from "./application/results/ReleaseResults.js";
import { UploadTestResult } from "./application/results/UploadTestResult.js";
import { GetAppointmentResultsController } from "./interface/http/controllers/GetAppointmentResultsController.js";
import { UploadTestResultController } from "./interface/http/controllers/UploadTestResultController.js";
import { DeleteTestResultController } from "./interface/http/controllers/DeleteTestResultController.js";
import { ReleaseResultsController } from "./interface/http/controllers/ReleaseResultsController.js";
import { OpenResultFileController } from "./interface/http/controllers/OpenResultFileController.js";
import { ListReviewQueueController } from "./interface/http/controllers/ListReviewQueueController.js";
import { ListMyResultsController } from "./interface/http/controllers/ListMyResultsController.js";
import type { PaymentGateway } from "./application/ports/PaymentGateway.js";
import { DrizzlePaymentRepository } from "./infrastructure/db/DrizzlePaymentRepository.js";
import { HandlePaymentWebhook } from "./application/payments/HandlePaymentWebhook.js";
import {
  ExportPayments,
  ListAppointmentPayments,
  ListMyPayments,
  ListPayments,
} from "./application/payments/ListPayments.js";
import { RecordCashPayment } from "./application/payments/RecordCashPayment.js";
import { RefundPayment } from "./application/payments/RefundPayment.js";
import { StartCardPayment } from "./application/payments/StartCardPayment.js";
import { StartCardPaymentController } from "./interface/http/controllers/StartCardPaymentController.js";
import { RecordCashPaymentController } from "./interface/http/controllers/RecordCashPaymentController.js";
import { HandlePaymentWebhookController } from "./interface/http/controllers/HandlePaymentWebhookController.js";
import { RefundPaymentController } from "./interface/http/controllers/RefundPaymentController.js";
import { ListPaymentsController } from "./interface/http/controllers/ListPaymentsController.js";
import { ExportPaymentsController } from "./interface/http/controllers/ExportPaymentsController.js";
import { ListMyPaymentsController } from "./interface/http/controllers/ListMyPaymentsController.js";
import { ListAppointmentPaymentsController } from "./interface/http/controllers/ListAppointmentPaymentsController.js";

export interface BuildAppOptions {
  db: Database;
  /** The same connection pool as `db`; express-session keeps its sessions through it. */
  pool: Pool;
  clock: Clock;
  passwordHasher: PasswordHasher;
  temporaryPasswords: TemporaryPasswordGenerator;
  accountEmails: AccountEmails;
  appointmentEmails: AppointmentEmails;
  sessionSecret: string;
  sessionTtlMinutes: number;
  /** HTTPS-only session cookie (production). */
  secureCookie: boolean;
  /** How many proxies (Netlify, Render) to trust for X-Forwarded-For / -Proto; 0 for none. */
  trustProxy: number;
  photoStorage: PhotoStorage;
  /** Where note attachments go (photos and PDFs). */
  fileStorage: FileStorage;
  /** Lab result files: never a public link, handed out after an access check. */
  privateFileStorage: PrivateFileStorage;
  /** Stripe card payments; null when Stripe isn't set up (only cash is taken). */
  paymentGateway: PaymentGateway | null;
  /** Set when photos are kept on this machine, so the app serves them at /api/uploads. */
  uploadsDir?: string;
  /** Tests swap it to see the health check report a database outage. */
  healthProbe?: DatabaseHealthProbe;
}

// The composition root: the only place that creates concrete classes and wires them together.
// main.ts runs it with the real services; the integration tests build their own copy.
export function buildApp(options: BuildAppOptions) {
  const { db, clock, passwordHasher: hasher, temporaryPasswords, accountEmails } = options;

  // Adapters
  const users = new DrizzleUserRepository(db);
  const sessions = new DrizzleSessionRepository(db);
  const access = new DrizzleAccessRepository(db);
  const roles = new DrizzleRoleRepository(db);
  const categories = new DrizzleProcedureCategoryRepository(db);
  const procedures = new DrizzleLabProcedureRepository(db);
  const promotions = new DrizzlePromotionRepository(db);
  const settings = new DrizzleSettingsRepository(db);
  const closedDays = new DrizzleClosedDayRepository(db);
  const teams = new DrizzleMedTeamRepository(db);
  const staff = new DrizzleStaffDirectory(db);
  const shifts = new DrizzleShiftRepository(db);
  const leave = new DrizzleLeaveRepository(db);
  const scheduleRepositories = { shifts, closedDays, leave };
  const appointments = new DrizzleAppointmentRepository(db);
  const noteRepositories = { appointments, teams, notes: new DrizzleAppointmentNoteRepository(db) };
  const availabilityRepositories = { ...scheduleRepositories, appointments, teams, settings };
  const quoteBooking = new QuoteBooking(procedures, promotions, clock);
  const { appointmentEmails, paymentGateway: gateway } = options;
  const payments = new DrizzlePaymentRepository(db);
  const paymentRepositories = { appointments, teams, payments };
  const results = new DrizzleResultRepository(db);
  const resultRepositories = { appointments, teams, results };
  const { privateFileStorage: privateFiles } = options;

  // Use cases
  const checkSystemHealth = new CheckSystemHealth(
    options.healthProbe ?? new DrizzleDatabaseHealthProbe(db),
  );
  const resolvePermissions = new ResolvePermissions(access, clock);
  const registerPatient = new RegisterPatient(users, hasher);
  const login = new Login(users, hasher, clock, resolvePermissions);
  const getCurrentUser = new GetCurrentUser(users, resolvePermissions);
  const changePassword = new ChangePassword(users, sessions, hasher, clock, resolvePermissions);
  const getProfile = new GetProfile(users);
  const updateProfile = new UpdateProfile(users);
  const authenticateRequest = new AuthenticateRequest(users, resolvePermissions);
  const listUsers = new ListUsers(users);
  const createStaffAccount = new CreateStaffAccount(
    users,
    hasher,
    temporaryPasswords,
    accountEmails,
    clock,
    roles,
  );
  const setUserActive = new SetUserActive(users, sessions);
  const reissueTemporaryPassword = new ReissueTemporaryPassword(
    users,
    sessions,
    hasher,
    temporaryPasswords,
    accountEmails,
    clock,
  );

  // HTTP
  return createApp({
    session: createSessionMiddleware({
      pool: options.pool,
      secret: options.sessionSecret,
      secureCookie: options.secureCookie,
      ttlMinutes: options.sessionTtlMinutes,
    }),
    trustProxy: options.trustProxy,
    uploadsDir: options.uploadsDir,
    controllers: {
      health: new HealthController(checkSystemHealth),
      registerPatient: new RegisterPatientController(registerPatient),
      login: new LoginController(login),
      logout: new LogoutController(),
      getCurrentUser: new GetCurrentUserController(getCurrentUser),
      changePassword: new ChangePasswordController(changePassword),
      getProfile: new GetProfileController(getProfile),
      updateProfile: new UpdateProfileController(updateProfile),
      setProfilePhoto: new SetProfilePhotoController(
        new SetProfilePhoto(users, options.photoStorage),
      ),
      removeProfilePhoto: new RemoveProfilePhotoController(
        new RemoveProfilePhoto(users, options.photoStorage),
      ),
      listUsers: new ListUsersController(listUsers),
      createStaffAccount: new CreateStaffAccountController(createStaffAccount),
      setUserActive: new SetUserActiveController(setUserActive),
      reissueTemporaryPassword: new ReissueTemporaryPasswordController(reissueTemporaryPassword),
      listRoles: new ListRolesController(new ListRoles(roles)),
      getCustomRole: new GetCustomRoleController(new GetCustomRole(roles)),
      createCustomRole: new CreateCustomRoleController(new CreateCustomRole(roles)),
      updateCustomRole: new UpdateCustomRoleController(new UpdateCustomRole(roles)),
      deleteCustomRole: new DeleteCustomRoleController(new DeleteCustomRole(roles)),
      assignCustomRole: new AssignCustomRoleController(new AssignCustomRole(users, roles)),
      listProcedureCategories: new ListProcedureCategoriesController(
        new ListProcedureCategories(categories),
      ),
      createProcedureCategory: new CreateProcedureCategoryController(
        new CreateProcedureCategory(categories),
      ),
      renameProcedureCategory: new RenameProcedureCategoryController(
        new RenameProcedureCategory(categories),
      ),
      deleteProcedureCategory: new DeleteProcedureCategoryController(
        new DeleteProcedureCategory(categories),
      ),
      listLabProcedures: new ListLabProceduresController(
        new ListLabProcedures(procedures, promotions, clock),
      ),
      getLabProcedure: new GetLabProcedureController(
        new GetLabProcedure(procedures, promotions, clock),
      ),
      createLabProcedure: new CreateLabProcedureController(
        new CreateLabProcedure(procedures, categories),
      ),
      updateLabProcedure: new UpdateLabProcedureController(
        new UpdateLabProcedure(procedures, categories),
      ),
      setLabProcedureActive: new SetLabProcedureActiveController(
        new SetLabProcedureActive(procedures),
      ),
      listPromotions: new ListPromotionsController(new ListPromotions(promotions, clock)),
      getPromotion: new GetPromotionController(new GetPromotion(promotions, clock)),
      createPromotion: new CreatePromotionController(
        new CreatePromotion(promotions, procedures, clock),
      ),
      updatePromotion: new UpdatePromotionController(
        new UpdatePromotion(promotions, procedures, clock),
      ),
      setPromotionActive: new SetPromotionActiveController(
        new SetPromotionActive(promotions, clock),
      ),
      getSystemSettings: new GetSystemSettingsController(new GetSystemSettings(settings)),
      updateSystemSettings: new UpdateSystemSettingsController(new UpdateSystemSettings(settings)),
      listClosedDays: new ListClosedDaysController(new ListClosedDays(closedDays)),
      addClosedDay: new AddClosedDayController(new AddClosedDay(closedDays)),
      updateClosedDay: new UpdateClosedDayController(new UpdateClosedDay(closedDays)),
      removeClosedDay: new RemoveClosedDayController(new RemoveClosedDay(closedDays)),
      listTeams: new ListTeamsController(new ListTeams(teams, staff, clock)),
      createTeam: new CreateTeamController(new CreateTeam(teams)),
      updateTeam: new UpdateTeamController(new UpdateTeam(teams)),
      setTeamActive: new SetTeamActiveController(new SetTeamActive(teams)),
      saveRoster: new SaveRosterController(new SaveRoster(teams, staff)),
      copyPreviousRosters: new CopyPreviousRostersController(new CopyPreviousRosters(teams, staff)),
      listStaff: new ListStaffController(new ListStaff(staff)),
      getMySchedule: new GetMyScheduleController(new GetMySchedule(scheduleRepositories)),
      getShiftBoard: new GetShiftBoardController(new GetShiftBoard(scheduleRepositories, staff)),
      setShiftDays: new SetShiftDaysController(new SetShiftDays(shifts, staff)),
      requestLeave: new RequestLeaveController(new RequestLeave(leave, teams, staff, clock)),
      listMyLeave: new ListMyLeaveController(new ListMyLeave(leave, staff)),
      cancelLeave: new CancelLeaveController(new CancelLeave(leave, staff, clock)),
      listLeaveInbox: new ListLeaveInboxController(new ListLeaveInbox(leave, staff)),
      decideLeave: new DecideLeaveController(new DecideLeave(leave, staff, clock)),
      listAllLeave: new ListAllLeaveController(new ListAllLeave(leave, staff)),
      getAvailability: new GetAvailabilityController(
        new GetAvailability(availabilityRepositories, clock),
      ),
      quoteBooking: new QuoteBookingController(quoteBooking),
      bookAppointment: new BookAppointmentController(
        new BookAppointment(availabilityRepositories, quoteBooking, appointmentEmails, clock),
      ),
      listMyAppointments: new ListMyAppointmentsController(
        new ListMyAppointments(appointments, settings, clock),
      ),
      getAppointment: new GetAppointmentController(
        new GetAppointment(appointments, teams, settings, clock),
      ),
      cancelAppointment: new CancelAppointmentController(
        new CancelAppointment(appointments, settings, appointmentEmails, clock),
      ),
      listAppointments: new ListAppointmentsController(
        new ListAppointments(appointments, settings, clock),
      ),
      acceptAppointment: new DecideAppointmentController(
        new DecideAppointment(availabilityRepositories, appointmentEmails, clock),
        "accept",
      ),
      rejectAppointment: new DecideAppointmentController(
        new DecideAppointment(availabilityRepositories, appointmentEmails, clock),
        "reject",
      ),
      proposeNewTime: new ProposeNewTimeController(
        new ProposeNewTime(availabilityRepositories, appointmentEmails, clock),
      ),
      listTeamChoices: new ListTeamChoicesController(new ListTeamChoices(availabilityRepositories)),
      assignTeam: new AssignTeamController(new AssignTeam(availabilityRepositories, clock)),
      listMyVisits: new ListMyVisitsController(new ListMyVisits(availabilityRepositories)),
      recordVisit: new RecordVisitController(new RecordVisit(availabilityRepositories)),
      listNotes: new ListAppointmentNotesController(new ListAppointmentNotes(noteRepositories)),
      addNote: new AddAppointmentNoteController(
        new AddAppointmentNote(noteRepositories, options.fileStorage),
      ),
      deleteAttachment: new DeleteAttachmentController(
        new DeleteAttachment(noteRepositories, options.fileStorage),
      ),
      scheduleReturnVisit: new ScheduleReturnVisitController(
        new ScheduleReturnVisit(availabilityRepositories, appointmentEmails, clock),
      ),
      listRouteTeams: new ListRouteTeamsController(new ListRouteTeams(availabilityRepositories)),
      getDailyRoute: new GetDailyRouteController(new GetDailyRoute(availabilityRepositories)),
      reorderRoute: new ReorderRouteController(new ReorderRoute(availabilityRepositories)),
      answerProposal: new AnswerProposalController(
        new AnswerProposal(availabilityRepositories, appointmentEmails, clock),
      ),
      listAppointmentPayments: new ListAppointmentPaymentsController(
        new ListAppointmentPayments(paymentRepositories, gateway),
      ),
      startCardPayment: new StartCardPaymentController(
        new StartCardPayment(paymentRepositories, gateway, clock),
      ),
      paymentWebhook: new HandlePaymentWebhookController(
        new HandlePaymentWebhook(paymentRepositories, gateway, appointmentEmails, clock),
      ),
      recordCashPayment: new RecordCashPaymentController(
        new RecordCashPayment(paymentRepositories, gateway, appointmentEmails, clock),
      ),
      refundPayment: new RefundPaymentController(
        new RefundPayment(paymentRepositories, gateway, appointmentEmails),
      ),
      listPayments: new ListPaymentsController(new ListPayments(payments)),
      exportPayments: new ExportPaymentsController(new ExportPayments(payments), clock),
      listMyPayments: new ListMyPaymentsController(new ListMyPayments(payments)),
      getAppointmentResults: new GetAppointmentResultsController(
        new GetAppointmentResults(resultRepositories),
      ),
      uploadTestResult: new UploadTestResultController(
        new UploadTestResult(resultRepositories, privateFiles),
      ),
      deleteTestResult: new DeleteTestResultController(
        new DeleteTestResult(resultRepositories, privateFiles),
      ),
      releaseResults: new ReleaseResultsController(
        new ReleaseResults(resultRepositories, appointmentEmails, clock),
      ),
      openResultFile: new OpenResultFileController(
        new OpenResultFile(resultRepositories, privateFiles),
      ),
      listReviewQueue: new ListReviewQueueController(new ListReviewQueue(results)),
      listMyResults: new ListMyResultsController(new ListMyResults(results)),
    },
    middlewares: {
      authenticate: new Authenticate(authenticateRequest),
      authenticateAllowingPasswordChange: new Authenticate(authenticateRequest, {
        allowPendingPasswordChange: true,
      }),
    },
  });
}
