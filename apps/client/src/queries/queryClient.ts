import { QueryClient } from "@tanstack/react-query";

/** One cache for the whole app. Data is refetched when a page opens, not on window focus. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  });
}
