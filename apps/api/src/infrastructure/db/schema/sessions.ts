import { index, json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Signed-in browsers: connect-pg-simple's table, read and written by express-session.
 * `sess` holds the cookie settings and `userId`. Deleting a row signs that browser out.
 */
export const session = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").$type<{ userId?: string }>().notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (table) => [index("session_expire_idx").on(table.expire)],
);
