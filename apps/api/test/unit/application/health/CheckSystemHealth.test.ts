import { describe, expect, it } from "vitest";
import type { DatabaseHealthProbe } from "../../../src/application/ports/databaseHealthProbe.js";
import { CheckSystemHealth } from "../../../src/application/use-cases/checkSystemHealth.js";

const probe = (reachable: boolean): DatabaseHealthProbe => ({
  isReachable: async () => reachable,
});

describe("CheckSystemHealth", () => {
  it("reports ok when the database is reachable", async () => {
    const result = await new CheckSystemHealth(probe(true)).execute();
    expect(result).toEqual({ overall: "ok", database: "ok" });
  });

  it("reports down when the database is unreachable", async () => {
    const result = await new CheckSystemHealth(probe(false)).execute();
    expect(result).toEqual({ overall: "down", database: "down" });
  });
});
