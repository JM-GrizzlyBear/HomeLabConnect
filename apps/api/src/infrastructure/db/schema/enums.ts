import { pgEnum } from "drizzle-orm/pg-core";

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

export const userRoleEnum = pgEnum("user_role", [
  "patient",
  "med_team",
  "doctor",
  "support",
  "admin",
]);

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);
