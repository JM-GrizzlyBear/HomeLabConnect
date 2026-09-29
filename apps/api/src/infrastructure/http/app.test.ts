import request from "supertest";
import { describe, expect, it } from "vitest";
import { CheckSystemHealth } from "../../application/use-cases/CheckSystemHealth.js";
import { HealthController } from "../../interface/http/controllers/HealthController.js";
import { createApp } from "./app.js";

function appWithDatabase(reachable: boolean) {
  const checkSystemHealth = new CheckSystemHealth({ isReachable: async () => reachable });
  return createApp({
    corsOrigin: "http://localhost:5173",
    controllers: { health: new HealthController(checkSystemHealth) },
  });
}

describe("GET /api/health", () => {
  it("returns 200 when the database is reachable", async () => {
    const res = await request(appWithDatabase(true)).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "ok" });
  });

  it("returns 503 when the database is down", async () => {
    const res = await request(appWithDatabase(false)).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "down", db: "down" });
  });
});

describe("unknown routes", () => {
  it("returns a JSON 404", async () => {
    const res = await request(appWithDatabase(true)).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("route_not_found");
  });
});
