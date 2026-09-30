import type { CurrentUser } from "@homelabconnect/shared";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/apiClient";
import * as authApi from "../api/auth";
import { AuthContext, type AuthState, type AuthStatus } from "./authContext";
import { tokenStorage } from "./tokenStorage";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (token ? "loading" : "signedOut"));

  // Restore the session after a reload by asking the API who the stored token belongs to.
  useEffect(() => {
    if (!token || user) return;
    const controller = new AbortController();
    authApi
      .fetchCurrentUser(token, controller.signal)
      .then((current) => {
        setUser(current);
        setStatus("signedIn");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // 401/403 means the token is dead (logged out, expired, deactivated).
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          tokenStorage.clear();
          setToken(null);
        }
        setStatus("signedOut");
      });
    return () => controller.abort();
  }, [token, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    tokenStorage.set(result.token);
    setToken(result.token);
    setUser(result.user);
    setStatus("signedIn");
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (token) await authApi.logout(token);
    } catch {
      // Sign out locally even if the API can't be reached.
    } finally {
      tokenStorage.clear();
      setToken(null);
      setUser(null);
      setStatus("signedOut");
    }
  }, [token]);

  const updateUser = useCallback((updated: CurrentUser) => setUser(updated), []);

  const value = useMemo<AuthState>(
    () => ({ status, user, token, signIn, signOut, updateUser }),
    [status, user, token, signIn, signOut, updateUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
