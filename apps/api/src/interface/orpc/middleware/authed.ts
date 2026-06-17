import { ORPCError } from "@orpc/server";
import { base } from "../base";
import type { AuthedUser } from "../context";

// Verifies the JWT from the Authorization header and attaches the user to ctx.
export const authedMiddleware = base.middleware(async ({ context, next }) => {
  const header = context.authHeader;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ORPCError("UNAUTHORIZED", { message: "Missing bearer token" });
  }
  const token = header.slice("Bearer ".length).trim();

  let payload;
  try {
    payload = context.tokens.verify(token);
  } catch {
    throw new ORPCError("UNAUTHORIZED", { message: "Invalid token" });
  }

  const user: AuthedUser = { id: payload.sub, role: payload.role };
  return next({ context: { ...context, user } });
});
