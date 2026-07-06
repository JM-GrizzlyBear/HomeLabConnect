import { authRouter } from "./auth.router";
import { patientRouter } from "./patient.router";
import { roleRouter } from "./role.router";

export const appRouter = {
  auth: authRouter,
  role: roleRouter,
  patient: patientRouter,
};
export type AppRouter = typeof appRouter;
