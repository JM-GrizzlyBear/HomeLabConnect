import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../../support/testApp.js";

describe("GET /api/health", () => {
  it("returns 200 when the database is reachable", async () => {
    const res = await request(buildTestApp().app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "ok" });
  });

  it("returns 503 when the database is down", async () => {
    const res = await request(buildTestApp({ databaseReachable: false }).app).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "down", db: "down" });
  });
});

describe("unknown routes", () => {
  it("returns a JSON 404", async () => {
    const res = await request(buildTestApp().app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("route_not_found");
  });
});
