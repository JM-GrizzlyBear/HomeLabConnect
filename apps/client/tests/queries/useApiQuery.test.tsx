import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useApiQuery } from "../../src/queries/useApiQuery";
import { QueryWrapper } from "../support/renderApp";

describe("useApiQuery", () => {
  it("loads, and reloads on demand", async () => {
    const load = vi.fn(async () => "data");

    const { result } = renderHook(() => useApiQuery(["things"], load), { wrapper: QueryWrapper });

    await waitFor(() => expect(result.current.data).toBe("data"));
    act(() => result.current.reload());
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  });

  it("doesn't load while disabled", async () => {
    const load = vi.fn(async () => "data");

    const { result } = renderHook(() => useApiQuery(["things"], load, { enabled: false }), {
      wrapper: QueryWrapper,
    });

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

    const { result } = renderHook(() => useApiQuery(["things"], load, { errorMessage: "Oops." }), {
      wrapper: QueryWrapper,
    });
    await waitFor(() => expect(result.current.data).toBe("first"));

    fail = true;
    act(() => result.current.reload());

    await waitFor(() => expect(result.current.error).toBe("Oops."));
    expect(result.current.data).toBe("first");
  });

  it("keeps showing the previous answer while a new key loads", async () => {
    const { result, rerender } = renderHook(
      ({ page }) => useApiQuery(["things", page], async () => `page ${page}`),
      { wrapper: QueryWrapper, initialProps: { page: 1 } },
    );
    await waitFor(() => expect(result.current.data).toBe("page 1"));

    rerender({ page: 2 });

    expect(result.current.data).toBe("page 1");
    await waitFor(() => expect(result.current.data).toBe("page 2"));
  });
});
