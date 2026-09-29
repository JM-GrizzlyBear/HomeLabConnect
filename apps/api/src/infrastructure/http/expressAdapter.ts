import type { RequestHandler } from "express";
import type { Controller, HttpRequest, Middleware } from "../../interface/http/httpTypes.js";

/**
 * Translates an Express request into a framework-free HttpRequest, runs the
 * middlewares in order, then the controller, and writes the response back.
 */
export function adapt(controller: Controller, ...middlewares: Middleware[]): RequestHandler {
  return async (req, res) => {
    let request: HttpRequest = {
      body: req.body,
      params: req.params as Record<string, string>,
      query: req.query as Record<string, unknown>,
      headers: req.headers,
      ip: req.ip ?? null,
    };
    for (const middleware of middlewares) request = await middleware.handle(request);

    const response = await controller.handle(request);
    if (response.body === undefined) res.status(response.status).end();
    else res.status(response.status).json(response.body);
  };
}
