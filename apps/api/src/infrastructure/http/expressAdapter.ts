import type { RequestHandler } from "express";
import type { Controller } from "../../interface/http/HttpTypes.js";

/** Translates an Express request into a framework-free HttpRequest and back. */
export function adapt(controller: Controller): RequestHandler {
  return async (req, res) => {
    const response = await controller.handle({
      body: req.body,
      params: req.params as Record<string, string>,
      query: req.query as Record<string, unknown>,
      headers: req.headers,
    });
    res.status(response.status).json(response.body);
  };
}
