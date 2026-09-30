import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { ChangePasswordController } from "../../interface/http/controllers/changePasswordController.js";
import type { CreateStaffAccountController } from "../../interface/http/controllers/createStaffAccountController.js";
import type { GetCurrentUserController } from "../../interface/http/controllers/getCurrentUserController.js";
import type { GetProfileController } from "../../interface/http/controllers/getProfileController.js";
import type { HealthController } from "../../interface/http/controllers/healthController.js";
import type { ListUsersController } from "../../interface/http/controllers/listUsersController.js";
import type { LoginController } from "../../interface/http/controllers/loginController.js";
import type { LogoutController } from "../../interface/http/controllers/logoutController.js";
import type { RegisterPatientController } from "../../interface/http/controllers/registerPatientController.js";
import type { ReissueTemporaryPasswordController } from "../../interface/http/controllers/reissueTemporaryPasswordController.js";
import type { SetUserActiveController } from "../../interface/http/controllers/setUserActiveController.js";
import type { UpdateProfileController } from "../../interface/http/controllers/updateProfileController.js";
import type { Middleware } from "../../interface/http/httpTypes.js";
import { RequirePermission } from "../../interface/http/middleware/requirePermission.js";
import { adapt } from "./expressAdapter.js";

export interface Controllers {
  health: HealthController;
  registerPatient: RegisterPatientController;
  login: LoginController;
  logout: LogoutController;
  getCurrentUser: GetCurrentUserController;
  changePassword: ChangePasswordController;
  getProfile: GetProfileController;
  updateProfile: UpdateProfileController;
  listUsers: ListUsersController;
  createStaffAccount: CreateStaffAccountController;
  setUserActive: SetUserActiveController;
  reissueTemporaryPassword: ReissueTemporaryPasswordController;
}

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

export function createRouter(controllers: Controllers, middlewares: Middlewares): Router {
  const router = Router();
  router.get("/health", adapt(controllers.health));

  router.post("/auth/register", adapt(controllers.registerPatient));
  router.post("/auth/login", passwordRateLimit(), adapt(controllers.login));
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

  const can = (permission: ConstructorParameters<typeof RequirePermission>[0]) => [
    middlewares.authenticate,
    new RequirePermission(permission),
  ];
  router.get("/users", adapt(controllers.listUsers, ...can("users.view")));
  router.post("/users/staff", adapt(controllers.createStaffAccount, ...can("users.create")));
  router.patch("/users/:id/status", adapt(controllers.setUserActive, ...can("users.deactivate")));
  router.post(
    "/users/:id/temporary-password",
    adapt(controllers.reissueTemporaryPassword, ...can("users.reset_password")),
  );

  return router;
}
