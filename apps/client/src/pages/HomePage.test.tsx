import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows the API and database status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", db: "ok" }), { status: 200 }),
    );

    render(<HomePage />);

    expect(await screen.findByText("API: ok")).toBeInTheDocument();
    expect(screen.getByText("DB: ok")).toBeInTheDocument();
  });

  it("shows unreachable when the API cannot be reached", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    render(<HomePage />);

    expect(await screen.findByText("API: unreachable")).toBeInTheDocument();
  });
});
