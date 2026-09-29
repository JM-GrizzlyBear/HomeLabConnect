import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { GetCurrentUserController } from "../../interface/http/controllers/getCurrentUserController.js";
import type { HealthController } from "../../interface/http/controllers/healthController.js";
import type { LoginController } from "../../interface/http/controllers/loginController.js";
import type { LogoutController } from "../../interface/http/controllers/logoutController.js";
import type { RegisterPatientController } from "../../interface/http/controllers/registerPatientController.js";
import type { Middleware } from "../../interface/http/httpTypes.js";
import { adapt } from "./expressAdapter.js";

export interface Controllers {
  health: HealthController;
  registerPatient: RegisterPatientController;
  login: LoginController;
  logout: LogoutController;
  getCurrentUser: GetCurrentUserController;
}

export interface Middlewares {
  /** Signed in with a permanent password. Use this for almost every route. */
  authenticate: Middleware;
  /** Signed in, possibly still on a temporary password. Only for /me, /password and /logout. */
  authenticateAllowingPasswordChange: Middleware;
}

/** Slows down password guessing: 10 failed attempts per IP per 15 minutes. */
function loginRateLimit() {
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

export function createRouter(controllers: Controllers, middlewares: Middlewares): Router {
  const router = Router();
  router.get("/health", adapt(controllers.health));

  router.post("/auth/register", adapt(controllers.registerPatient));
  router.post("/auth/login", loginRateLimit(), adapt(controllers.login));
  router.post(
    "/auth/logout",
    adapt(controllers.logout, middlewares.authenticateAllowingPasswordChange),
  );
  router.get(
    "/auth/me",
    adapt(controllers.getCurrentUser, middlewares.authenticateAllowingPasswordChange),
  );

  return router;
}
