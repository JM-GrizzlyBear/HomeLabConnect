import cors from "cors";
import express from "express";
import { tokens, usecases } from "../../composition-root";
import { env } from "../../env";
import type { Context } from "../../interface/orpc/context";
import { rpcHandler } from "../../interface/orpc/rpc-handler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "homelabconnect-api" });
  });

  // oRPC endpoint. The Next.js client points at POST /rpc/<procedure-path>.
  app.use("/rpc", async (req, res, next) => {
    const context: Context = {
      user: null, // authedMiddleware fills this in if the call needs auth
      authHeader: req.headers.authorization,
      tokens,
      usecases,
    };

    const result = await rpcHandler.handle(req, res, {
      prefix: "/rpc",
      context,
    });
    if (!result.matched) next();
  });

  // Fallback error handler
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
