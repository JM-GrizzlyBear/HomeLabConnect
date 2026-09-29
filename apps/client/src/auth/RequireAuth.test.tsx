import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../test/renderApp";

describe("protected pages", () => {
  beforeEach(() => localStorage.clear());

  it("send a signed-out visitor to the sign-in page", async () => {
    mockApi({});
    const router = renderApp("/app");

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("restore the session from a stored token", async () => {
    localStorage.setItem("homelabconnect.token", "tkn");
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
    renderApp("/app");

    expect(await screen.findByText("Welcome back, Juan")).toBeInTheDocument();
  });

  it("drop a stored token the API no longer accepts", async () => {
    localStorage.setItem("homelabconnect.token", "revoked");
    mockApi({
      "GET /api/auth/me": () => ({
        status: 401,
        body: { error: { code: "unauthenticated", message: "You need to sign in." } },
      }),
    });
    renderApp("/app");

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(localStorage.getItem("homelabconnect.token")).toBeNull();
  });

  it("log out through the API and return to sign in", async () => {
    localStorage.setItem("homelabconnect.token", "tkn");
    const fetchSpy = mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: sampleUser }),
      "POST /api/auth/logout": () => ({ status: 204 }),
    });
    const router = renderApp("/app");

    await userEvent.click(await screen.findByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(localStorage.getItem("homelabconnect.token")).toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/logout", expect.anything());
  });

  it("show the temporary-password warning", async () => {
    localStorage.setItem("homelabconnect.token", "tkn");
    mockApi({
      "GET /api/auth/me": () => ({
        status: 200,
        body: { ...sampleUser, mustChangePassword: true },
      }),
    });
    renderApp("/app");

    expect(await screen.findByText(/temporary password/)).toBeInTheDocument();
  });
});
