import type { ComponentStatus } from "../../domain/health/systemHealth.js";
import { SystemHealth } from "../../domain/health/systemHealth.js";
import type { DatabaseHealthProbe } from "../ports/databaseHealthProbe.js";

export interface CheckSystemHealthOutput {
  overall: ComponentStatus;
  database: ComponentStatus;
}

export class CheckSystemHealth {
  constructor(private readonly database: DatabaseHealthProbe) {}

  async execute(): Promise<CheckSystemHealthOutput> {
    const reachable = await this.database.isReachable();
    const health = SystemHealth.of({ database: reachable ? "ok" : "down" });
    return { overall: health.overall, database: health.database };
  }
}
