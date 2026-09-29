import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../test/renderApp";

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText("First name"), "Juan");
  await userEvent.type(screen.getByLabelText("Last name"), "Dela Cruz");
  await userEvent.type(screen.getByLabelText("Email"), "juan@example.com");
  await userEvent.type(screen.getByLabelText("Mobile number"), "09171234567");
  await userEvent.type(screen.getByLabelText("Password"), "Password123");
}

describe("RegisterPage", () => {
  it("creates the account and sends the patient to sign in", async () => {
    let sent: unknown;
    mockApi({
      "POST /api/auth/register": (body) => {
        sent = body;
        return { status: 201, body: sampleUser };
      },
    });
    const router = renderApp("/register");

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Account created. Sign in to continue.")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByLabelText("Email")).toHaveValue("juan@example.com");
    // Empty optional fields are left out, not sent as "".
    expect(sent).toEqual({
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "juan@example.com",
      phone: "09171234567",
      password: "Password123",
    });
  });

  it("shows field errors without calling the API", async () => {
    const fetchSpy = mockApi({});
    renderApp("/register");

    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Enter your first name.")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("marks the email field when it is already registered", async () => {
    mockApi({
      "POST /api/auth/register": () => ({
        status: 409,
        body: {
          error: { code: "email_taken", message: "An account with this email already exists." },
        },
      }),
    });
    renderApp("/register");

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });
});
