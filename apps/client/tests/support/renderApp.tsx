import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";
import { AuthProvider } from "../../src/auth/AuthProvider";
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
      ? handler(init.body ? JSON.parse(String(init.body)) : undefined, init)
      : { status: 404, body: { error: { code: "route_not_found", message: key } } };
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
}

/** Renders the real routes, starting at `path`, inside the AuthProvider. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

export const sampleUser = {
  id: "8d6f3a52-5b7e-4c1a-9d57-1f7a3c2b9e10",
  email: "juan@example.com",
  role: "patient" as const,
  firstName: "Juan",
  lastName: "Dela Cruz",
  mustChangePassword: false,
};

export const health = () => ({ status: 200, body: { status: "ok", db: "ok" } });
