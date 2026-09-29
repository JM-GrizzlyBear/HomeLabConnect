import { timestamp } from "drizzle-orm/pg-core";

/** Every timestamp is timezone-aware (`timestamptz`). */
export const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const timestamps = {
  createdAt: timestamptz("created_at").notNull().defaultNow(),
  updatedAt: timestamptz("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
