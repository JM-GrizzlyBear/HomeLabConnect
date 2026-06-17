import { authRouter } from "./auth.router";
import { roleRouter } from "./role.router";

export const appRouter = {
  auth: authRouter,
  role: roleRouter,
};
export type AppRouter = typeof appRouter;
