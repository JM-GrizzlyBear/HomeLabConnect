import type { AuditLog, NewAuditEntry } from "../../domain/audit/auditEntry.js";
import type { Clock } from "../ports/Clock.js";

/**
 * Adds an entry to the audit log. It never fails the action it records: if the log can't be
 * written, the error is reported and the action still succeeds.
 */
export class RecordAuditEntry {
  constructor(
    private readonly log: AuditLog,
    private readonly clock: Clock,
  ) {}

  async execute(entry: NewAuditEntry): Promise<void> {
    try {
      await this.log.record({ ...entry, at: this.clock.now() });
    } catch (error) {
      console.error(`Could not write the audit entry "${entry.action}":`, error);
    }
  }
}
