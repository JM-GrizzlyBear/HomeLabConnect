import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";
import helmet from "helmet";
import { presentError, presentNotFound } from "../../interface/http/presenters/ErrorPresenter.js";
import { type Controllers, createRouter } from "./routes.js";

export interface AppOptions {
  corsOrigin: string;
  controllers: Controllers;
}

export function createApp({ corsOrigin, controllers }: AppOptions): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", createRouter(controllers));

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
