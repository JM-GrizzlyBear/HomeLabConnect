import type { RequestHandler } from "express";
import type { Middleware } from "../../interface/http/httpTypes.js";
import { requireAuth } from "../../interface/http/middleware/Authenticate.js";
import type { SseHub } from "../realtime/SseHub.js";
import { toHttpRequest } from "./expressAdapter.js";

/**
 * GET /api/events: one long-lived Server-Sent Events stream per browser tab, for the signed-in
 * user. A comment every 15 seconds keeps proxies from closing it; if it drops anyway, the
 * browser reconnects after 3 seconds and refetches what it shows.
 */
export function eventStream(
  authenticate: Middleware,
  hub: SseHub,
  heartbeatMs = 15_000,
): RequestHandler {
  return async (req, res) => {
    const { userId } = requireAuth(await authenticate.handle(toHttpRequest(req)));
    res.status(200).set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Tells buffering proxies (nginx and the like) to pass each event straight through
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 3000\n\n");

    const disconnect = hub.connect(userId, res);
    const heartbeat = setInterval(() => res.write(": ping\n\n"), heartbeatMs);
    heartbeat.unref();
    req.on("close", () => {
      clearInterval(heartbeat);
      disconnect();
    });
  };
}
