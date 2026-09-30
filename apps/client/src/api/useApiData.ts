import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/authContext";

interface ApiDataOptions {
  /** false skips loading, e.g. while a dialog is closed. */
  enabled?: boolean;
  /** Shown when the request fails. */
  errorMessage?: string;
}

export interface ApiData<T> {
  /** The last loaded value; kept while a reload or a new filter is loading. */
  data: T | null;
  error: string | null;
  /** Loads again with the same inputs, e.g. after a change. */
  reload(): void;
}

/**
 * Loads data for the signed-in user and reloads when `deps` change. The
 * previous request is aborted, so a slow answer never overwrites a newer one.
 *
 * `load` may be a new function on every render; only `deps` decide when it runs.
 */
export function useApiData<T>(
  load: (token: string, signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  { enabled = true, errorMessage = "Could not load this. Try again." }: ApiDataOptions = {},
): ApiData<T> {
  const { token } = useAuth();
  const [state, setState] = useState<{ data: T | null; error: string | null }>({
    data: null,
    error: null,
  });
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);
  const key = JSON.stringify(deps);

  // Declared before the loading effect, so it always runs the latest `load`.
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (!token || !enabled) return;
    const controller = new AbortController();
    async function run(authToken: string) {
      try {
        const data = await loadRef.current(authToken, controller.signal);
        if (!controller.signal.aborted) setState({ data, error: null });
      } catch {
        if (controller.signal.aborted) return;
        setState((current) => ({ ...current, error: errorMessage }));
      }
    }
    void run(token);
    return () => controller.abort();
  }, [token, enabled, key, version, errorMessage]);

  const reload = useCallback(() => setVersion((n) => n + 1), []);
  return { ...state, reload };
}
