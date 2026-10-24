import { keepPreviousData, type QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface ApiQueryOptions {
  /** false skips loading, e.g. while a dialog is closed. */
  enabled?: boolean;
  /** Shown when the request fails. */
  errorMessage?: string;
}

export interface ApiQuery<T> {
  /** The last loaded value; kept while a new filter is loading. */
  data: T | null;
  error: string | null;
  /** Refreshes every cached query of this feature (the key's first part), e.g. after a change. */
  reload(): void;
}

/**
 * Loads data through the TanStack Query cache. The session cookie says who is asking;
 * a cancelled or outdated request never overwrites a newer answer.
 */
export function useApiQuery<T>(
  key: QueryKey,
  load: (signal: AbortSignal) => Promise<T>,
  { enabled = true, errorMessage = "Could not load this. Try again." }: ApiQueryOptions = {},
): ApiQuery<T> {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => await load(signal),
    enabled,
    placeholderData: keepPreviousData,
  });
  const feature = key[0];
  const reload = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [feature] });
  }, [queryClient, feature]);

  return {
    data: query.data ?? null,
    error: query.isError ? errorMessage : null,
    reload,
  };
}
