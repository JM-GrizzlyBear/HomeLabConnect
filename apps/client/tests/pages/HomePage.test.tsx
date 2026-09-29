import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { health, mockApi, renderApp } from "../support/renderApp";

describe("HomePage", () => {
  it("shows the API and database status", async () => {
    mockApi({ "GET /api/health": health });

    renderApp("/");

    expect(await screen.findByText("API: ok")).toBeInTheDocument();
    expect(screen.getByText("DB: ok")).toBeInTheDocument();
  });

  it("shows unreachable when the API cannot be reached", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    renderApp("/");

    expect(await screen.findByText("API: unreachable")).toBeInTheDocument();
  });

  it("links to sign in and registration", async () => {
    mockApi({ "GET /api/health": health });

    renderApp("/");

    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
