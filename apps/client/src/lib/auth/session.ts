import "server-only";

import { cookies } from "next/headers";
import type { PublicUser } from "@homelabconnect/shared";
import { createApiClient } from "@/lib/orpc/client";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // matches API's default JWT_EXPIRES_IN (7d)
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    return await createApiClient(token).auth.me();
  } catch {
    return null;
  }
}
