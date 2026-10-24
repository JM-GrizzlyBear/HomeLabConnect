import type { SessionUser } from "@homelabconnect/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useMemo } from "react";
import { ApiError } from "../api/apiClient";
import * as authApi from "../api/auth";
import { queryKeys } from "../queries/queryKeys";
import { AuthContext, type AuthState, type AuthStatus } from "./authContext";

/** Who is signed in (null: nobody). The session is an httpOnly cookie, so the API answers. */
async function fetchSignedInUser(signal: AbortSignal): Promise<SessionUser | null> {
  try {
    return await authApi.fetchCurrentUser(signal);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Every page reads this one cached answer.
  const current = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async ({ signal }) => await fetchSignedInUser(signal),
    staleTime: Infinity,
    retry: false,
  });

  const setUser = useCallback(
    (user: SessionUser | null) => {
      // Forget the previous user's data, but keep the answer the pages watch.
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== queryKeys.currentUser[0],
      });
      queryClient.setQueryData(queryKeys.currentUser, user);
    },
    [queryClient],
  );

  const logIn = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) =>
      await authApi.login(credentials),
    onSuccess: (result) => setUser(result.user),
  });
  const logOut = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        // Sign out locally even if the API can't be reached.
      }
    },
    onSettled: () => setUser(null),
  });

  const { mutateAsync: logInAsync } = logIn;
  const signIn = useCallback(
    async (email: string, password: string) => (await logInAsync({ email, password })).user,
    [logInAsync],
  );
  const { mutateAsync: logOutAsync } = logOut;
  const signOut = useCallback(async () => await logOutAsync(), [logOutAsync]);
  const updateUser = useCallback(
    (updated: SessionUser) => queryClient.setQueryData(queryKeys.currentUser, updated),
    [queryClient],
  );

  const user = current.data ?? null;
  const status: AuthStatus = current.isPending ? "loading" : user ? "signedIn" : "signedOut";
  const value = useMemo<AuthState>(
    () => ({ status, user, signIn, signOut, updateUser }),
    [status, user, signIn, signOut, updateUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
