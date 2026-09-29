// Builds the real Express app on in-memory fakes, wired the same way as main.ts.
import { AuthenticateRequest } from "../application/use-cases/authenticateRequest.js";
import { CheckSystemHealth } from "../application/use-cases/checkSystemHealth.js";
import { GetCurrentUser } from "../application/use-cases/getCurrentUser.js";
import { Login } from "../application/use-cases/login.js";
import { Logout } from "../application/use-cases/logout.js";
import { RegisterPatient } from "../application/use-cases/registerPatient.js";
import { createApp } from "../infrastructure/http/app.js";
import { GetCurrentUserController } from "../interface/http/controllers/getCurrentUserController.js";
import { HealthController } from "../interface/http/controllers/healthController.js";
import { LoginController } from "../interface/http/controllers/loginController.js";
import { LogoutController } from "../interface/http/controllers/logoutController.js";
import { RegisterPatientController } from "../interface/http/controllers/registerPatientController.js";
import { Authenticate } from "../interface/http/middleware/authenticate.js";
import {
  FakePasswordHasher,
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
    },
    middlewares: {
      authenticate: new Authenticate(authenticateRequest),
      authenticateAllowingPasswordChange: new Authenticate(authenticateRequest, {
        allowPendingPasswordChange: true,
      }),
    },
  });

  return { app, clock, users, sessions };
}
