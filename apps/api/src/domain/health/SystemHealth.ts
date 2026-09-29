export type ComponentStatus = "ok" | "down";

/**
 * Health of the system and of each component it depends on.
 * Business rule: the system is only "ok" when every component is "ok".
 */
export class SystemHealth {
  private constructor(readonly database: ComponentStatus) {}

  static of(components: { database: ComponentStatus }): SystemHealth {
    return new SystemHealth(components.database);
  }

  get overall(): ComponentStatus {
    return this.database === "ok" ? "ok" : "down";
  }
}
