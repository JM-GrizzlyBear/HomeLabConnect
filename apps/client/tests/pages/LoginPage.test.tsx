import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../support/renderApp";

describe("LoginPage", () => {
  beforeEach(() => localStorage.clear());

  it("signs in and opens the dashboard", async () => {
    mockApi({
      "POST /api/auth/login": () => ({
        status: 200,
        body: { user: sampleUser },
      }),
    });
    const router = renderApp("/login");

    await userEvent.type(await screen.findByLabelText("Email"), "juan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Password123");
    await userEvent.click(screen.getByRole("button", { name: "Login Now" }));

    expect(await screen.findByText("Welcome back, Juan")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/app");
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

    await userEvent.type(await screen.findByLabelText("Email"), "juan@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Wrong1234");
    await userEvent.click(screen.getByRole("button", { name: "Login Now" }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("Couldn't sign you in")).toBeInTheDocument();
    expect(dialog.getByText("Email or password is incorrect.")).toBeInTheDocument();
  });

  it("tells a user whose temporary password expired to ask an admin", async () => {
    mockApi({
      "POST /api/auth/login": () => ({
        status: 401,
        body: {
          error: {
            code: "temporary_password_expired",
            message: "Your temporary password has expired. Ask an admin to send you a new one.",
          },
        },
      }),
    });
    renderApp("/login");

    await userEvent.type(await screen.findByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Xk7mP2qR9wTz");
    await userEvent.click(screen.getByRole("button", { name: "Login Now" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Your temporary password has expired. Ask an admin to send you a new one.",
    );
  });

  it("validates before calling the API", async () => {
    const fetchSpy = mockApi({});
    renderApp("/login");

    await userEvent.type(await screen.findByLabelText("Email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "Login Now" }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalledWith("/api/auth/login", expect.anything());
  });
});
