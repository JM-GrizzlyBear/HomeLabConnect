// Builds the real Express app on in-memory fakes, wired the same way as main.ts.
import { AssignCustomRole } from "../../src/application/use-cases/assignCustomRole.js";
import { CreateCustomRole } from "../../src/application/use-cases/createCustomRole.js";
import { DeleteCustomRole } from "../../src/application/use-cases/deleteCustomRole.js";
import { GetCustomRole } from "../../src/application/use-cases/getCustomRole.js";
import { ListRoles } from "../../src/application/use-cases/listRoles.js";
import { UpdateCustomRole } from "../../src/application/use-cases/updateCustomRole.js";
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
import { ResolvePermissions } from "../../src/application/use-cases/resolvePermissions.js";
import { ReissueTemporaryPassword } from "../../src/application/use-cases/reissueTemporaryPassword.js";
import { SetUserActive } from "../../src/application/use-cases/setUserActive.js";
import { UpdateProfile } from "../../src/application/use-cases/updateProfile.js";
import { createApp } from "../../src/infrastructure/http/app.js";
import { AssignCustomRoleController } from "../../src/interface/http/controllers/assignCustomRoleController.js";
import { CreateCustomRoleController } from "../../src/interface/http/controllers/createCustomRoleController.js";
import { DeleteCustomRoleController } from "../../src/interface/http/controllers/deleteCustomRoleController.js";
import { GetCustomRoleController } from "../../src/interface/http/controllers/getCustomRoleController.js";
import { ListRolesController } from "../../src/interface/http/controllers/listRolesController.js";
import { UpdateCustomRoleController } from "../../src/interface/http/controllers/updateCustomRoleController.js";
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
import {
  FakeAccountEmails,
  FakePasswordHasher,
  FakeTemporaryPasswordGenerator,
  InMemoryAccessRepository,
  InMemoryRoleRepository,
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
  const roles = new InMemoryRoleRepository(users);
  const access = new InMemoryAccessRepository(users, roles);
  const resolvePermissions = new ResolvePermissions(access, clock);
  const emails = new FakeAccountEmails();
  const passwords = new FakeTemporaryPasswordGenerator();
  const authenticateRequest = new AuthenticateRequest(
    tokens,
    sessions,
    users,
    clock,
    resolvePermissions,
  );

  const app = createApp({
    corsOrigin: "http://localhost:5173",
    controllers: {
      health: new HealthController(
        new CheckSystemHealth({ isReachable: async () => databaseReachable }),
      ),
      registerPatient: new RegisterPatientController(new RegisterPatient(users, hasher)),
      login: new LoginController(
        new Login(users, sessions, hasher, tokens, clock, resolvePermissions, {
          sessionTtlMinutes: 60,
        }),
      ),
      logout: new LogoutController(new Logout(sessions, clock)),
      getCurrentUser: new GetCurrentUserController(new GetCurrentUser(users, resolvePermissions)),
      changePassword: new ChangePasswordController(
        new ChangePassword(users, sessions, hasher, clock, resolvePermissions),
      ),
      getProfile: new GetProfileController(new GetProfile(users)),
      updateProfile: new UpdateProfileController(new UpdateProfile(users)),
      listUsers: new ListUsersController(new ListUsers(users)),
      createStaffAccount: new CreateStaffAccountController(
        new CreateStaffAccount(users, hasher, passwords, emails, clock, roles),
      ),
      setUserActive: new SetUserActiveController(new SetUserActive(users, sessions, clock)),
      reissueTemporaryPassword: new ReissueTemporaryPasswordController(
        new ReissueTemporaryPassword(users, sessions, hasher, passwords, emails, clock),
      ),
      listRoles: new ListRolesController(new ListRoles(roles)),
      getCustomRole: new GetCustomRoleController(new GetCustomRole(roles)),
      createCustomRole: new CreateCustomRoleController(new CreateCustomRole(roles)),
      updateCustomRole: new UpdateCustomRoleController(new UpdateCustomRole(roles)),
      deleteCustomRole: new DeleteCustomRoleController(new DeleteCustomRole(roles)),
      assignCustomRole: new AssignCustomRoleController(new AssignCustomRole(users, roles)),
    },
    middlewares: {
      authenticate: new Authenticate(authenticateRequest),
      authenticateAllowingPasswordChange: new Authenticate(authenticateRequest, {
        allowPendingPasswordChange: true,
      }),
    },
  });

  return { app, clock, users, sessions, roles, access, emails, passwords };
}
