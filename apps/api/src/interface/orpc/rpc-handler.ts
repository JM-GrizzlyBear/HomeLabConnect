import { RPCHandler } from "@orpc/server/node";
import { appRouter } from "./routers";

// One handler instance, reused per request. We pass per-request context
// (user, usecases, tokens) when calling .handle() in express-app.ts.
export const rpcHandler = new RPCHandler(appRouter);
