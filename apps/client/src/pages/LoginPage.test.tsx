import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../test/renderApp";

describe("LoginPage", () => {
  beforeEach(() => localStorage.clear());

  it("signs in, stores the token and opens the dashboard", async () => {
    mockApi({
      "POST /api/auth/login": () => ({
        status: 200,
        body: { token: "tkn", expiresAt: "2026-01-15T20:00:00.000Z", user: sampleUser },
      }),
    });
    const router = renderApp("/login");

    await userEvent.type(screen.getByLabelText("Email"), "juan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: "Login Now" }));

    expect(await screen.findByText("Welcome back, Juan")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/app");
    expect(localStorage.getItem("homelabconnect.token")).toBe("tkn");
  });

  it("shows the API's message for wrong credentials", async () => {
    mockApi({
      "POST /api/auth/login": () => ({
        status: 401,
        body: {
          error: { code: "invalid_credentials", message: "Email or password is incorrect." },
        },
      }),
    });
    renderApp("/login");

    await userEvent.type(screen.getByLabelText("Email"), "juan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Wrong1234");
    await userEvent.click(screen.getByRole("button", { name: "Login Now" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  });

  it("validates before calling the API", async () => {
    const fetchSpy = mockApi({});
    renderApp("/login");

    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "Login Now" }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
