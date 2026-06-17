import { base } from "../base";
import { authedMiddleware } from "../middleware/authed";

// Authed procedure: handler can rely on ctx.user being non-null.
export const authedProcedure = base.use(authedMiddleware);
