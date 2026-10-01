import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { AssignCustomRoleController } from "../../interface/http/controllers/assignCustomRoleController.js";
import type { CreateCustomRoleController } from "../../interface/http/controllers/createCustomRoleController.js";
import type { DeleteCustomRoleController } from "../../interface/http/controllers/deleteCustomRoleController.js";
import type { GetCustomRoleController } from "../../interface/http/controllers/getCustomRoleController.js";
import type { ListRolesController } from "../../interface/http/controllers/listRolesController.js";
import type { UpdateCustomRoleController } from "../../interface/http/controllers/updateCustomRoleController.js";
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
import type { CreateLabProcedureController } from "../../interface/http/controllers/createLabProcedureController.js";
import type { CreateProcedureCategoryController } from "../../interface/http/controllers/createProcedureCategoryController.js";
import type { DeleteProcedureCategoryController } from "../../interface/http/controllers/deleteProcedureCategoryController.js";
import type { GetLabProcedureController } from "../../interface/http/controllers/getLabProcedureController.js";
import type { ListLabProceduresController } from "../../interface/http/controllers/listLabProceduresController.js";
import type { ListProcedureCategoriesController } from "../../interface/http/controllers/listProcedureCategoriesController.js";
import type { RenameProcedureCategoryController } from "../../interface/http/controllers/renameProcedureCategoryController.js";
import type { SetLabProcedureActiveController } from "../../interface/http/controllers/setLabProcedureActiveController.js";
import type { UpdateLabProcedureController } from "../../interface/http/controllers/updateLabProcedureController.js";
import type { CreatePromotionController } from "../../interface/http/controllers/createPromotionController.js";
import type { GetPromotionController } from "../../interface/http/controllers/getPromotionController.js";
import type { ListPromotionsController } from "../../interface/http/controllers/listPromotionsController.js";
import type { SetPromotionActiveController } from "../../interface/http/controllers/setPromotionActiveController.js";
import type { UpdatePromotionController } from "../../interface/http/controllers/updatePromotionController.js";
import type { AddClosedDayController } from "../../interface/http/controllers/addClosedDayController.js";
import type { GetSystemSettingsController } from "../../interface/http/controllers/getSystemSettingsController.js";
import type { ListClosedDaysController } from "../../interface/http/controllers/listClosedDaysController.js";
import type { RemoveClosedDayController } from "../../interface/http/controllers/removeClosedDayController.js";
import type { UpdateClosedDayController } from "../../interface/http/controllers/updateClosedDayController.js";
import type { UpdateSystemSettingsController } from "../../interface/http/controllers/updateSystemSettingsController.js";
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

  return router;
}
