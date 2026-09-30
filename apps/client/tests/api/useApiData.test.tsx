import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApiData } from "../../src/api/useApiData";
import { AuthProvider } from "../../src/auth/AuthProvider";
import { mockApi, sampleUser } from "../support/renderApp";

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

/** A promise the test resolves or rejects by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useApiData", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
  });

  it("loads with the signed-in token and reloads on demand", async () => {
    const load = vi.fn(async (token: string) => `data for ${token}`);

    const { result } = renderHook(() => useApiData(load, []), { wrapper });

    await waitFor(() => expect(result.current.data).toBe("data for tkn"));
    act(() => result.current.reload());
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  });

  it("doesn't load while disabled", async () => {
    const load = vi.fn(async () => "data");

    const { result } = renderHook(() => useApiData(load, [], { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(load).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("reports a failure and keeps the last good data", async () => {
    let fail = false;
    const load = vi.fn(async () => {
      if (fail) throw new Error("down");
      return "first";
    });

    const { result } = renderHook(() => useApiData(load, [], { errorMessage: "Oops." }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.data).toBe("first"));

    fail = true;
    act(() => result.current.reload());

    await waitFor(() => expect(result.current.error).toBe("Oops."));
    expect(result.current.data).toBe("first");
  });

  it("ignores a slow answer for inputs that have since changed", async () => {
    const answers = { a: deferred<string>(), b: deferred<string>() };
    const load = (query: "a" | "b") => () => answers[query].promise;

    const { result, rerender } = renderHook(
      ({ query }: { query: "a" | "b" }) => useApiData(load(query), [query]),
      { wrapper, initialProps: { query: "a" } },
    );
    rerender({ query: "b" });
    answers.b.resolve("b");
    await waitFor(() => expect(result.current.data).toBe("b"));

    answers.a.resolve("a");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current.data).toBe("b");
  });
});
