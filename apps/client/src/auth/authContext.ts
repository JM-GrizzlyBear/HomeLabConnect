import type { SessionUser } from "@homelabconnect/shared";
import { createContext, useContext } from "react";

export type AuthStatus = "loading" | "signedIn" | "signedOut";

export interface AuthState {
  status: AuthStatus;
  /** The signed-in user, with their effective permission keys. */
  user: SessionUser | null;
  token: string | null;
  signIn(email: string, password: string): Promise<SessionUser>;
  signOut(): Promise<void>;
  /** Replaces the signed-in user after the API returns a newer copy (password or profile change). */
  updateUser(user: SessionUser): void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>.");
  return auth;
}
