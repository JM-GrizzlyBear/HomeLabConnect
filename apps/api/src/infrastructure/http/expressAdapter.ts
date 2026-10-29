import type { Request, RequestHandler } from "express";
import type { Controller, HttpRequest, Middleware } from "../../interface/http/httpTypes.js";
import { applySessionChange } from "./session.js";

/** The framework-free HttpRequest for an Express request. */
export function toHttpRequest(req: Request): HttpRequest {
  return {
    body: req.body,
    params: req.params as Record<string, string>,
    query: req.query as Record<string, unknown>,
    headers: req.headers,
    ip: req.ip ?? null,
    session: { id: req.sessionID, userId: req.session.userId ?? null },
    file: req.file && {
      data: new Uint8Array(req.file.buffer),
      size: req.file.size,
      filename: req.file.originalname,
    },
  };
}

/**
 * Translates an Express request into a framework-free HttpRequest, runs the
 * middlewares in order, then the controller, and writes the response back.
 */
export function adapt(controller: Controller, ...middlewares: Middleware[]): RequestHandler {
  return async (req, res) => {
    let request = toHttpRequest(req);
    for (const middleware of middlewares) request = await middleware.handle(request);

    const response = await controller.handle(request);
    if (response.session) await applySessionChange(req, res, response.session);
    if (response.headers) res.set(response.headers);
    if (response.redirect) res.redirect(response.status, response.redirect);
    else if (response.body === undefined) res.status(response.status).end();
    else if (response.body instanceof Uint8Array) {
      res.status(response.status).send(Buffer.from(response.body));
    } else if (typeof response.body === "string") res.status(response.status).send(response.body);
    else res.status(response.status).json(response.body);
  };
}
