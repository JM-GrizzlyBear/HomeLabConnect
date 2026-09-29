import { Router } from "express";
import type { HealthController } from "../../interface/http/controllers/HealthController.js";
import { adapt } from "./expressAdapter.js";

export interface Controllers {
  health: HealthController;
}

export function createRouter(controllers: Controllers): Router {
  const router = Router();
  router.get("/health", adapt(controllers.health));
  return router;
}
