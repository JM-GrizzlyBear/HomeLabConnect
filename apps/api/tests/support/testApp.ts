// Builds the real Express app on in-memory fakes, wired the same way as main.ts.
import { AuthenticateRequest } from "../../src/application/use-cases/authenticateRequest.js";
import { ChangePassword } from "../../src/application/use-cases/changePassword.js";
import { CheckSystemHealth } from "../../src/application/use-cases/checkSystemHealth.js";
import { CreateStaffAccount } from "../../src/application/use-cases/createStaffAccount.js";
import { GetCurrentUser } from "../../src/application/use-cases/getCurrentUser.js";
import { GetProfile } from "../../src/application/use-cases/getProfile.js";
import { ListUsers } from "../../src/application/use-cases/listUsers.js";
import { Login } from "../../src/application/use-cases/login.js";
import { Logout } from "../../src/application/use-cases/logout.js";
import { RegisterPatient } from "../../src/application/use-cases/registerPatient.js";
import { ReissueTemporaryPassword } from "../../src/application/use-cases/reissueTemporaryPassword.js";
import { SetUserActive } from "../../src/application/use-cases/setUserActive.js";
import { UpdateProfile } from "../../src/application/use-cases/updateProfile.js";
import { createApp } from "../../src/infrastructure/http/app.js";
import { ChangePasswordController } from "../../src/interface/http/controllers/changePasswordController.js";
import { CreateStaffAccountController } from "../../src/interface/http/controllers/createStaffAccountController.js";
import { GetCurrentUserController } from "../../src/interface/http/controllers/getCurrentUserController.js";
import { GetProfileController } from "../../src/interface/http/controllers/getProfileController.js";
import { HealthController } from "../../src/interface/http/controllers/healthController.js";
import { ListUsersController } from "../../src/interface/http/controllers/listUsersController.js";
import { LoginController } from "../../src/interface/http/controllers/loginController.js";
import { LogoutController } from "../../src/interface/http/controllers/logoutController.js";
import { RegisterPatientController } from "../../src/interface/http/controllers/registerPatientController.js";
import { ReissueTemporaryPasswordController } from "../../src/interface/http/controllers/reissueTemporaryPasswordController.js";
import { SetUserActiveController } from "../../src/interface/http/controllers/setUserActiveController.js";
import { UpdateProfileController } from "../../src/interface/http/controllers/updateProfileController.js";
import { Authenticate } from "../../src/interface/http/middleware/authenticate.js";
import { RequireBaseRole } from "../../src/interface/http/middleware/requireBaseRole.js";
import {
  FakeAccountEmails,
  FakePasswordHasher,
  FakeTemporaryPasswordGenerator,
  FakeTokenService,
  FixedClock,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "./fakes.js";

export function buildTestApp({ databaseReachable = true } = {}) {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository(clock);
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();
  const emails = new FakeAccountEmails();
  const passwords = new FakeTemporaryPasswordGenerator();
  const authenticateRequest = new AuthenticateRequest(tokens, sessions, users, clock);

  const app = createApp({
    corsOrigin: "http://localhost:5173",
    controllers: {
      health: new HealthController(
        new CheckSystemHealth({ isReachable: async () => databaseReachable }),
      ),
      registerPatient: new RegisterPatientController(new RegisterPatient(users, hasher)),
      login: new LoginController(
        new Login(users, sessions, hasher, tokens, clock, { sessionTtlMinutes: 60 }),
      ),
      logout: new LogoutController(new Logout(sessions, clock)),
      getCurrentUser: new GetCurrentUserController(new GetCurrentUser(users)),
      changePassword: new ChangePasswordController(
        new ChangePassword(users, sessions, hasher, clock),
      ),
      getProfile: new GetProfileController(new GetProfile(users)),
      updateProfile: new UpdateProfileController(new UpdateProfile(users)),
      listUsers: new ListUsersController(new ListUsers(users)),
      createStaffAccount: new CreateStaffAccountController(
        new CreateStaffAccount(users, hasher, passwords, emails, clock),
      ),
      setUserActive: new SetUserActiveController(new SetUserActive(users, sessions, clock)),
      reissueTemporaryPassword: new ReissueTemporaryPasswordController(
        new ReissueTemporaryPassword(users, sessions, hasher, passwords, emails, clock),
      ),
    },
    middlewares: {
      authenticate: new Authenticate(authenticateRequest),
      authenticateAllowingPasswordChange: new Authenticate(authenticateRequest, {
        allowPendingPasswordChange: true,
      }),
      requireAdmin: new RequireBaseRole("admin"),
    },
  });

  return { app, clock, users, sessions, emails, passwords };
}
