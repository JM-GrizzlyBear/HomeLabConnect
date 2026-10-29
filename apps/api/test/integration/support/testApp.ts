// The real app on the test database. Outside services (clock, email, temporary passwords)
// are fakes so tests can control and inspect them.
import { sql } from "drizzle-orm";
import type { Express } from "express";
import request from "supertest";
import { afterAll } from "vitest";
import type { DatabaseHealthProbe } from "../../../src/application/ports/DatabaseHealthProbe.js";
import { buildApp } from "../../../src/buildApp.js";
import { BcryptPasswordHasher } from "../../../src/infrastructure/auth/BcryptPasswordHasher.js";
import { createDatabase, type Database } from "../../../src/infrastructure/db/client.js";
import { SESSION_COOKIE } from "../../../src/infrastructure/http/session.js";
import {
  FakeAccountEmails,
  FakeAppointmentEmails,
  FakeFileStorage,
  FakePaymentGateway,
  FakePrivateFileStorage,
  FakePhotoStorage,
  FakeTemporaryPasswordGenerator,
  FixedClock,
} from "../../support/fakes.js";
import { Given, PASSWORD } from "./given.js";
import { testDatabaseUrl } from "./testDatabase.js";

// Written once by globalSetup and never changed by the app, so the reset keeps them
const CATALOGUE_TABLES = ["roles", "modules", "permissions", "role_permissions"];

let connection: ReturnType<typeof createDatabase> | undefined;
let dataTables: string[] | undefined;

function database(): Database {
  connection ??= createDatabase(testDatabaseUrl());
  return connection.db;
}

afterAll(async () => {
  await connection?.pool.end();
  connection = undefined;
});

/** Empties every table except the permission catalogue, so each test starts clean. */
async function resetDatabase(db: Database): Promise<void> {
  if (!dataTables) {
    const result = await db.execute<{ tablename: string }>(
      sql`select tablename from pg_tables where schemaname = 'public'`,
    );
    dataTables = result.rows
      .map((row) => row.tablename)
      .filter((name) => !CATALOGUE_TABLES.includes(name));
  }
  if (dataTables.length === 0) return;
  const list = dataTables.map((name) => `"${name}"`).join(", ");
  await db.execute(sql.raw(`truncate table ${list} restart identity cascade`));
}

/** Resets the test database and builds the app on it. Call at the start of every test. */
export async function buildTestApp({ databaseReachable = true, cardPayments = true } = {}) {
  const db = database();
  const { pool } = connection!;
  await resetDatabase(db);

  const clock = new FixedClock();
  const emails = new FakeAccountEmails();
  const passwords = new FakeTemporaryPasswordGenerator();
  const photos = new FakePhotoStorage();
  const appointmentEmails = new FakeAppointmentEmails();
  const files = new FakeFileStorage();
  const gateway = new FakePaymentGateway();
  const privateFiles = new FakePrivateFileStorage();
  const unreachable: DatabaseHealthProbe = { isReachable: async () => false };

  const app = buildApp({
    db,
    pool,
    clock,
    passwordHasher: new BcryptPasswordHasher(4),
    temporaryPasswords: passwords,
    accountEmails: emails,
    appointmentEmails,
    sessionSecret: "test-secret-that-is-at-least-32-characters-long",
    sessionTtlMinutes: 60,
    secureCookie: false,
    trustProxy: 0,
    photoStorage: photos,
    fileStorage: files,
    paymentGateway: cardPayments ? gateway : null,
    privateFileStorage: privateFiles,
    healthProbe: databaseReachable ? undefined : unreachable,
  });

  return {
    app,
    db,
    clock,
    emails,
    appointmentEmails,
    passwords,
    photos,
    files,
    gateway,
    privateFiles,
    given: new Given(db),
  };
}

/** Signs in and returns the session cookie header that makes later requests count as that user. */
export async function signIn(app: Express, email: string, password = PASSWORD) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`Couldn't sign in as ${email}: ${res.status}`);
  return { Cookie: sessionCookie(res.headers["set-cookie"]) };
}

/** "hlc.sid=…" from a response's Set-Cookie header. */
export function sessionCookie(setCookie: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const cookie = cookies.find((value) => value.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) throw new Error("The response set no session cookie.");
  return cookie.split(";")[0]!;
}
