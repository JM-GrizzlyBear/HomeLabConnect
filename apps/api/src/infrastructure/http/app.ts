import express, { type ErrorRequestHandler, type Express, type RequestHandler } from "express";
import helmet from "helmet";
import { presentError, presentNotFound } from "../../interface/http/presenters/errorPresenter.js";
import type { SseHub } from "../realtime/SseHub.js";
import { eventStream } from "./eventStream.js";
import { adapt } from "./expressAdapter.js";
import { type Controllers, createRouter, type Middlewares } from "./routes.js";

export interface AppOptions {
  controllers: Controllers;
  middlewares: Middlewares;
  /** express-session, backed by Postgres (see session.ts). */
  session: RequestHandler;
  /** How many proxies (Netlify, Render) to trust for X-Forwarded-For / -Proto; 0 for none. */
  trustProxy: number;
  /** Photos kept on this machine (PHOTO_STORAGE=local), served at /api/uploads. */
  uploadsDir?: string;
  /** Live events for signed-in browsers, at /api/events. */
  events: SseHub;
}

// No CORS: the browser always calls the API on its own address
// (Vite forwards /api in development, Netlify in production).
export function createApp({
  controllers,
  middlewares,
  session,
  trustProxy,
  uploadsDir,
  events,
}: AppOptions): Express {
  const app = express();

  app.disable("x-powered-by");
  if (trustProxy > 0) app.set("trust proxy", trustProxy);
  app.use(helmet());
  app.use(session);
  // Stripe signs the exact bytes it sends, so this one route reads the body raw
  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    adapt(controllers.paymentWebhook),
  );
  app.get("/api/events", eventStream(middlewares.authenticate, events));
  app.use(express.json({ limit: "1mb" }));
  if (uploadsDir) app.use("/api/uploads", express.static(uploadsDir, { index: false }));

  app.use("/api", createRouter(controllers, middlewares));

  app.use((_req, res) => {
    const { status, body } = presentNotFound();
    res.status(status).json(body);
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error?.type === "entity.parse.failed") {
      res
        .status(400)
        .json({ error: { code: "invalid_json", message: "Request body is not valid JSON." } });
      return;
    }
    const { status, body } = presentError(error);
    if (status >= 500) console.error(error);
    res.status(status).json(body);
  };
  app.use(errorHandler);

  return app;
}
