import { defaultBaseGrants, PERMISSION_KEYS } from "@homelabconnect/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";
import { AuthProvider } from "../../src/auth/AuthProvider";
import { TooltipProvider } from "../../src/components/ui/tooltip";
import { FeedbackProvider } from "../../src/feedback/FeedbackProvider";
import { routes } from "../../src/router";

type Handler = (body: unknown, init: RequestInit) => { status: number; body?: unknown };

/**
 * Fakes the API by "METHOD /api/path". Unlisted calls get a 404, so a test
 * fails loudly if the page calls something unexpected.
 */
export function mockApi(handlers: Record<string, Handler>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init = {}) => {
    const key = `${init.method ?? "GET"} ${String(input)}`;
    const handler = handlers[key];
    const { status, body } = handler
      ? handler(readBody(init.body), init)
      : { status: 404, body: { error: { code: "route_not_found", message: key } } };
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
}

/** A fresh query cache per test, without retries, so one test's data never leaks into the next. */
export function QueryWrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** JSON bodies are parsed; a FormData upload is passed through as is. */
function readBody(body: RequestInit["body"]): unknown {
  if (body instanceof FormData) return body;
  return body ? JSON.parse(String(body)) : undefined;
}

/** Renders the real routes, starting at `path`, inside the AuthProvider. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryWrapper>
      <AuthProvider>
        <TooltipProvider>
          {/* Toasts stay put in tests, so a slow run can't miss them. */}
          <FeedbackProvider toastDurationMs={60_000}>
            <RouterProvider router={router} />
          </FeedbackProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryWrapper>,
  );
  return router;
}

/** The success toasts in the top-right corner. */
export const toasts = () => within(screen.getByRole("status"));

export const sampleUser = {
  id: "8d6f3a52-5b7e-4c1a-9d57-1f7a3c2b9e10",
  email: "juan@example.com",
  role: "patient" as const,
  firstName: "Juan",
  lastName: "Dela Cruz",
  mustChangePassword: false,
  photoUrl: null as string | null,
  permissions: [...defaultBaseGrants.patient] as string[],
};

/** An admin: every permission. */
export const adminUser = {
  ...sampleUser,
  role: "admin" as const,
  firstName: "System",
  lastName: "Admin",
  permissions: [...PERMISSION_KEYS] as string[],
};

export const health = () => ({ status: 200, body: { status: "ok", db: "ok" } });
