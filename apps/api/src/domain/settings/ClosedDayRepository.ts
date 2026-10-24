import type { ClosedDay, ClosedDayDetails } from "../../domain/settings/closedDay.js";

/** Port: holidays and special days off. There are only a few dozen, so no paging. */
export interface ClosedDayRepository {
  /** Every closed day, yearly ones first, then by date. */
  list(): Promise<ClosedDay[]>;
  findById(id: string): Promise<ClosedDay | null>;
  create(details: ClosedDayDetails, actorId: string): Promise<ClosedDay>;
  update(id: string, details: ClosedDayDetails): Promise<void>;
  delete(id: string): Promise<void>;
}
