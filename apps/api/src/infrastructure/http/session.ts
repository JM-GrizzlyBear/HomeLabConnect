import connectPgSimple from "connect-pg-simple";
import type { Request, Response } from "express";
import session from "express-session";
import type { Pool } from "pg";
import type { SessionChange } from "../../interface/http/httpTypes.js";

// What's stored in a session: only who is signed in
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export const SESSION_COOKIE = "hlc.sid";

export interface SessionOptions {
  pool: Pool;
  secret: string;
  /** HTTPS-only cookie (production). */
  secureCookie: boolean;
  ttlMinutes: number;
}

/** Sessions live in Postgres (the `session` table); the browser only holds a signed id. */
export function createSessionMiddleware(options: SessionOptions) {
  const PgStore = connectPgSimple(session);
  return session({
    store: new PgStore({ pool: options.pool, tableName: "session" }),
    name: SESSION_COOKIE,
    secret: options.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // JavaScript in the page can't read it
      sameSite: "lax", // not sent on cross-site POSTs
      secure: options.secureCookie,
      maxAge: options.ttlMinutes * 60_000,
    },
  });
}

/** Applies a controller's session instruction to the Express request. */
export async function applySessionChange(
  req: Request,
  res: Response,
  change: SessionChange,
): Promise<void> {
  if ("signIn" in change) await startSession(req, change.signIn);
  else await endSession(req, res);
}

// A brand-new session id at sign-in, so an id planted before it is useless (session fixation)
async function startSession(req: Request, userId: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
  req.session.userId = userId;
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

// Deletes the session row, so the old cookie stops working
async function endSession(req: Request, res: Response): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
  res.clearCookie(SESSION_COOKIE);
}
