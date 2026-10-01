// Composition root: the only place that creates concrete classes and wires
// them together. Everything else receives its dependencies via constructors.
import { AssignCustomRole } from "./application/use-cases/assignCustomRole.js";
import { CreateCustomRole } from "./application/use-cases/createCustomRole.js";
import { DeleteCustomRole } from "./application/use-cases/deleteCustomRole.js";
import { GetCustomRole } from "./application/use-cases/getCustomRole.js";
import { ListRoles } from "./application/use-cases/listRoles.js";
import { UpdateCustomRole } from "./application/use-cases/updateCustomRole.js";
import { AuthenticateRequest } from "./application/use-cases/authenticateRequest.js";
import { ChangePassword } from "./application/use-cases/changePassword.js";
import { CheckSystemHealth } from "./application/use-cases/checkSystemHealth.js";
import { CreateStaffAccount } from "./application/use-cases/createStaffAccount.js";
import { GetCurrentUser } from "./application/use-cases/getCurrentUser.js";
import { GetProfile } from "./application/use-cases/getProfile.js";
import { ListUsers } from "./application/use-cases/listUsers.js";
import { Login } from "./application/use-cases/login.js";
import { Logout } from "./application/use-cases/logout.js";
import { RegisterPatient } from "./application/use-cases/registerPatient.js";
import { ResolvePermissions } from "./application/use-cases/resolvePermissions.js";
import { ReissueTemporaryPassword } from "./application/use-cases/reissueTemporaryPassword.js";
import { SetUserActive } from "./application/use-cases/setUserActive.js";
import { UpdateProfile } from "./application/use-cases/updateProfile.js";
import { CreateLabProcedure } from "./application/use-cases/createLabProcedure.js";
import { CreateProcedureCategory } from "./application/use-cases/createProcedureCategory.js";
import { DeleteProcedureCategory } from "./application/use-cases/deleteProcedureCategory.js";
import { GetLabProcedure } from "./application/use-cases/getLabProcedure.js";
import { ListLabProcedures } from "./application/use-cases/listLabProcedures.js";
import { ListProcedureCategories } from "./application/use-cases/listProcedureCategories.js";
import { RenameProcedureCategory } from "./application/use-cases/renameProcedureCategory.js";
import { SetLabProcedureActive } from "./application/use-cases/setLabProcedureActive.js";
import { UpdateLabProcedure } from "./application/use-cases/updateLabProcedure.js";
import { CreatePromotion } from "./application/use-cases/createPromotion.js";
import { GetPromotion } from "./application/use-cases/getPromotion.js";
import { ListPromotions } from "./application/use-cases/listPromotions.js";
import { SetPromotionActive } from "./application/use-cases/setPromotionActive.js";
import { UpdatePromotion } from "./application/use-cases/updatePromotion.js";
import { AddClosedDay } from "./application/use-cases/addClosedDay.js";
import { GetSystemSettings } from "./application/use-cases/getSystemSettings.js";
import { ListClosedDays } from "./application/use-cases/listClosedDays.js";
import { RemoveClosedDay } from "./application/use-cases/removeClosedDay.js";
import { UpdateClosedDay } from "./application/use-cases/updateClosedDay.js";
import { UpdateSystemSettings } from "./application/use-cases/updateSystemSettings.js";
import { BcryptPasswordHasher } from "./infrastructure/auth/bcryptPasswordHasher.js";
import { CryptoTemporaryPasswordGenerator } from "./infrastructure/auth/cryptoTemporaryPasswordGenerator.js";
import { JwtTokenService } from "./infrastructure/auth/jwtTokenService.js";
import { loadConfig } from "./infrastructure/config.js";
import { createDatabase } from "./infrastructure/db/client.js";
import { DrizzleAccessRepository } from "./infrastructure/db/drizzleAccessRepository.js";
import { DrizzleRoleRepository } from "./infrastructure/db/drizzleRoleRepository.js";
import { DrizzleDatabaseHealthProbe } from "./infrastructure/db/drizzleDatabaseHealthProbe.js";
import { DrizzleSessionRepository } from "./infrastructure/db/drizzleSessionRepository.js";
import { DrizzleUserRepository } from "./infrastructure/db/drizzleUserRepository.js";
import { DrizzleLabProcedureRepository } from "./infrastructure/db/drizzleLabProcedureRepository.js";
import { DrizzleProcedureCategoryRepository } from "./infrastructure/db/drizzleProcedureCategoryRepository.js";
import { DrizzlePromotionRepository } from "./infrastructure/db/drizzlePromotionRepository.js";
import { DrizzleClosedDayRepository } from "./infrastructure/db/drizzleClosedDayRepository.js";
import { DrizzleSettingsRepository } from "./infrastructure/db/drizzleSettingsRepository.js";
import { createApp } from "./infrastructure/http/app.js";
import { NodemailerAccountEmails } from "./infrastructure/mail/nodemailerAccountEmails.js";
import { SystemClock } from "./infrastructure/systemClock.js";
import { AssignCustomRoleController } from "./interface/http/controllers/assignCustomRoleController.js";
import { CreateCustomRoleController } from "./interface/http/controllers/createCustomRoleController.js";
import { DeleteCustomRoleController } from "./interface/http/controllers/deleteCustomRoleController.js";
import { GetCustomRoleController } from "./interface/http/controllers/getCustomRoleController.js";
import { ListRolesController } from "./interface/http/controllers/listRolesController.js";
import { UpdateCustomRoleController } from "./interface/http/controllers/updateCustomRoleController.js";
import { ChangePasswordController } from "./interface/http/controllers/changePasswordController.js";
import { CreateStaffAccountController } from "./interface/http/controllers/createStaffAccountController.js";
import { GetCurrentUserController } from "./interface/http/controllers/getCurrentUserController.js";
import { GetProfileController } from "./interface/http/controllers/getProfileController.js";
import { HealthController } from "./interface/http/controllers/healthController.js";
import { ListUsersController } from "./interface/http/controllers/listUsersController.js";
import { LoginController } from "./interface/http/controllers/loginController.js";
import { LogoutController } from "./interface/http/controllers/logoutController.js";
import { RegisterPatientController } from "./interface/http/controllers/registerPatientController.js";
import { ReissueTemporaryPasswordController } from "./interface/http/controllers/reissueTemporaryPasswordController.js";
import { SetUserActiveController } from "./interface/http/controllers/setUserActiveController.js";
import { UpdateProfileController } from "./interface/http/controllers/updateProfileController.js";
import { CreateLabProcedureController } from "./interface/http/controllers/createLabProcedureController.js";
import { CreateProcedureCategoryController } from "./interface/http/controllers/createProcedureCategoryController.js";
import { DeleteProcedureCategoryController } from "./interface/http/controllers/deleteProcedureCategoryController.js";
import { GetLabProcedureController } from "./interface/http/controllers/getLabProcedureController.js";
import { ListLabProceduresController } from "./interface/http/controllers/listLabProceduresController.js";
import { ListProcedureCategoriesController } from "./interface/http/controllers/listProcedureCategoriesController.js";
import { RenameProcedureCategoryController } from "./interface/http/controllers/renameProcedureCategoryController.js";
import { SetLabProcedureActiveController } from "./interface/http/controllers/setLabProcedureActiveController.js";
import { UpdateLabProcedureController } from "./interface/http/controllers/updateLabProcedureController.js";
import { CreatePromotionController } from "./interface/http/controllers/createPromotionController.js";
import { GetPromotionController } from "./interface/http/controllers/getPromotionController.js";
import { ListPromotionsController } from "./interface/http/controllers/listPromotionsController.js";
import { SetPromotionActiveController } from "./interface/http/controllers/setPromotionActiveController.js";
import { UpdatePromotionController } from "./interface/http/controllers/updatePromotionController.js";
import { AddClosedDayController } from "./interface/http/controllers/addClosedDayController.js";
import { GetSystemSettingsController } from "./interface/http/controllers/getSystemSettingsController.js";
import { ListClosedDaysController } from "./interface/http/controllers/listClosedDaysController.js";
import { RemoveClosedDayController } from "./interface/http/controllers/removeClosedDayController.js";
import { UpdateClosedDayController } from "./interface/http/controllers/updateClosedDayController.js";
import { UpdateSystemSettingsController } from "./interface/http/controllers/updateSystemSettingsController.js";
import { Authenticate } from "./interface/http/middleware/authenticate.js";

const config = loadConfig();
const { db, pool } = createDatabase(config.databaseUrl);

// Adapters
const clock = new SystemClock();
const users = new DrizzleUserRepository(db);
const sessions = new DrizzleSessionRepository(db);
const hasher = new BcryptPasswordHasher();
const tokens = new JwtTokenService(config.jwtSecret);
const access = new DrizzleAccessRepository(db);
const roles = new DrizzleRoleRepository(db);
const categories = new DrizzleProcedureCategoryRepository(db);
const procedures = new DrizzleLabProcedureRepository(db);
const promotions = new DrizzlePromotionRepository(db);
const settings = new DrizzleSettingsRepository(db);
const closedDays = new DrizzleClosedDayRepository(db);
const temporaryPasswords = new CryptoTemporaryPasswordGenerator();
const accountEmails = new NodemailerAccountEmails({
  smtpHost: config.smtpHost,
  smtpPort: config.smtpPort,
  from: config.mailFrom,
  appUrl: config.appUrl,
});

// Use cases
const checkSystemHealth = new CheckSystemHealth(new DrizzleDatabaseHealthProbe(db));
const resolvePermissions = new ResolvePermissions(access, clock);
const registerPatient = new RegisterPatient(users, hasher);
const login = new Login(users, sessions, hasher, tokens, clock, resolvePermissions, {
  sessionTtlMinutes: config.sessionTtlMinutes,
});
const logout = new Logout(sessions, clock);
const getCurrentUser = new GetCurrentUser(users, resolvePermissions);
const changePassword = new ChangePassword(users, sessions, hasher, clock, resolvePermissions);
const getProfile = new GetProfile(users);
const updateProfile = new UpdateProfile(users);
const authenticateRequest = new AuthenticateRequest(
  tokens,
  sessions,
  users,
  clock,
  resolvePermissions,
);
const listUsers = new ListUsers(users);
const createStaffAccount = new CreateStaffAccount(
  users,
  hasher,
  temporaryPasswords,
  accountEmails,
  clock,
  roles,
);
const setUserActive = new SetUserActive(users, sessions, clock);
const reissueTemporaryPassword = new ReissueTemporaryPassword(
  users,
  sessions,
  hasher,
  temporaryPasswords,
  accountEmails,
  clock,
);

// HTTP
const app = createApp({
  corsOrigin: config.appUrl,
  controllers: {
    health: new HealthController(checkSystemHealth),
    registerPatient: new RegisterPatientController(registerPatient),
    login: new LoginController(login),
    logout: new LogoutController(logout),
    getCurrentUser: new GetCurrentUserController(getCurrentUser),
    changePassword: new ChangePasswordController(changePassword),
    getProfile: new GetProfileController(getProfile),
    updateProfile: new UpdateProfileController(updateProfile),
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
    setPromotionActive: new SetPromotionActiveController(new SetPromotionActive(promotions, clock)),
    getSystemSettings: new GetSystemSettingsController(new GetSystemSettings(settings)),
    updateSystemSettings: new UpdateSystemSettingsController(new UpdateSystemSettings(settings)),
    listClosedDays: new ListClosedDaysController(new ListClosedDays(closedDays)),
    addClosedDay: new AddClosedDayController(new AddClosedDay(closedDays)),
    updateClosedDay: new UpdateClosedDayController(new UpdateClosedDay(closedDays)),
    removeClosedDay: new RemoveClosedDayController(new RemoveClosedDay(closedDays)),
  },
  middlewares: {
    authenticate: new Authenticate(authenticateRequest),
    authenticateAllowingPasswordChange: new Authenticate(authenticateRequest, {
      allowPendingPasswordChange: true,
    }),
  },
});

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
