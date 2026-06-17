import { os } from "@orpc/server";
import type { Context } from "./context";

// All procedures derive from this base. The .$context call binds the
// shape of the per-request context that handlers will see.
export const base = os.$context<Context>();
