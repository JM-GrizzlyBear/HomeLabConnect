// Composition root: the only place that creates concrete classes and wires
// them together. Everything else receives its dependencies via constructors.
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
import { ReissueTemporaryPassword } from "./application/use-cases/reissueTemporaryPassword.js";
import { SetUserActive } from "./application/use-cases/setUserActive.js";
import { UpdateProfile } from "./application/use-cases/updateProfile.js";
import { BcryptPasswordHasher } from "./infrastructure/auth/bcryptPasswordHasher.js";
import { CryptoTemporaryPasswordGenerator } from "./infrastructure/auth/cryptoTemporaryPasswordGenerator.js";
import { JwtTokenService } from "./infrastructure/auth/jwtTokenService.js";
import { loadConfig } from "./infrastructure/config.js";
import { createDatabase } from "./infrastructure/db/client.js";
import { DrizzleDatabaseHealthProbe } from "./infrastructure/db/drizzleDatabaseHealthProbe.js";
import { DrizzleSessionRepository } from "./infrastructure/db/drizzleSessionRepository.js";
import { DrizzleUserRepository } from "./infrastructure/db/drizzleUserRepository.js";
import { createApp } from "./infrastructure/http/app.js";
import { NodemailerAccountEmails } from "./infrastructure/mail/nodemailerAccountEmails.js";
import { SystemClock } from "./infrastructure/systemClock.js";
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
import { Authenticate } from "./interface/http/middleware/authenticate.js";
import { RequireBaseRole } from "./interface/http/middleware/requireBaseRole.js";

const config = loadConfig();
const { db, pool } = createDatabase(config.databaseUrl);

// Adapters
const clock = new SystemClock();
const users = new DrizzleUserRepository(db);
const sessions = new DrizzleSessionRepository(db);
const hasher = new BcryptPasswordHasher();
const tokens = new JwtTokenService(config.jwtSecret);
const temporaryPasswords = new CryptoTemporaryPasswordGenerator();
const accountEmails = new NodemailerAccountEmails({
  smtpHost: config.smtpHost,
  smtpPort: config.smtpPort,
  from: config.mailFrom,
  appUrl: config.appUrl,
});

// Use cases
const checkSystemHealth = new CheckSystemHealth(new DrizzleDatabaseHealthProbe(db));
const registerPatient = new RegisterPatient(users, hasher);
const login = new Login(users, sessions, hasher, tokens, clock, {
  sessionTtlMinutes: config.sessionTtlMinutes,
});
const logout = new Logout(sessions, clock);
const getCurrentUser = new GetCurrentUser(users);
const changePassword = new ChangePassword(users, sessions, hasher, clock);
const getProfile = new GetProfile(users);
const updateProfile = new UpdateProfile(users);
const authenticateRequest = new AuthenticateRequest(tokens, sessions, users, clock);
const listUsers = new ListUsers(users);
const createStaffAccount = new CreateStaffAccount(
  users,
  hasher,
  temporaryPasswords,
  accountEmails,
  clock,
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
  },
  middlewares: {
    authenticate: new Authenticate(authenticateRequest),
    authenticateAllowingPasswordChange: new Authenticate(authenticateRequest, {
      allowPendingPasswordChange: true,
    }),
    requireAdmin: new RequireBaseRole("admin"),
  },
});

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
