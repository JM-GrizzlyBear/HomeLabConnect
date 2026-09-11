import "server-only";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
// Type-only import: erased at build time, does not pull in the API's runtime code.
import type { AppRouter } from "@homelabconnect/api/src/interface/orpc/routers/index.ts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Server-only oRPC client; `token` comes from the caller's session cookie.
export function createApiClient(token?: string): RouterClient<AppRouter> {
  const link = new RPCLink({
    url: `${API_URL}/rpc`,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });

  return createORPCClient(link);
}
