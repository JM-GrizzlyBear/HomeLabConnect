import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../support/renderApp";

const admin = { ...sampleUser, role: "admin" as const, firstName: "System", lastName: "Admin" };

const createdUser = {
  id: "2b1f7c3e-0a4d-4e8b-9c61-5d2e8f9a7b30",
  email: "ana@example.com",
  role: "support" as const,
  firstName: "Ana",
  lastName: "Reyes",
  mustChangePassword: true,
};

async function fillForm() {
  await userEvent.type(await screen.findByLabelText("Email"), "ana@example.com");
  await userEvent.type(screen.getByLabelText("First name"), "Ana");
  await userEvent.type(screen.getByLabelText("Last name"), "Reyes");
  await userEvent.click(screen.getByRole("combobox", { name: "Role" }));
  await userEvent.click(await screen.findByRole("option", { name: "Support" }));
}

describe("CreateStaffPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("homelabconnect.token", "tkn");
  });

  it("creates a staff account and says the password was emailed", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      "POST /api/users/staff": (body) => {
        sent = body;
        return {
          status: 201,
          body: {
            user: createdUser,
            temporaryPasswordExpiresAt: "2026-01-22T08:00:00.000Z",
            emailSent: true,
          },
        };
      },
    });
    renderApp("/app/users/new");

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("Staff account created")).toBeInTheDocument();
    expect(dialog.getByText(/temporary password was emailed/)).toHaveTextContent("ana@example.com");
    expect(sent).toEqual({
      email: "ana@example.com",
      firstName: "Ana",
      lastName: "Reyes",
      phone: null,
      role: "support",
      hiredOn: null,
    });
    // The form is cleared for the next account.
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });

  it("shows the temporary password once when the email couldn't be sent", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      "POST /api/users/staff": () => ({
        status: 201,
        body: {
          user: createdUser,
          temporaryPasswordExpiresAt: "2026-01-22T08:00:00.000Z",
          emailSent: false,
          temporaryPassword: "Xk7mP2qR9wTz",
        },
      }),
    });
    renderApp("/app/users/new");

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(/couldn't email/)).toBeInTheDocument();
    expect(dialog.getByLabelText("Temporary password")).toHaveTextContent("Xk7mP2qR9wTz");
    expect(dialog.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("puts a duplicate-email error under the email field, not in a dialog", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      "POST /api/users/staff": () => ({
        status: 409,
        body: {
          error: { code: "email_taken", message: "An account with this email already exists." },
        },
      }),
    });
    renderApp("/app/users/new");

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByLabelText("Email")).toHaveAccessibleDescription(
      "An account with this email already exists.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a server failure in an error dialog", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: admin }),
      "POST /api/users/staff": () => ({
        status: 500,
        body: { error: { code: "internal_error", message: "Something went wrong." } },
      }),
    });
    renderApp("/app/users/new");

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("Couldn't create the account")).toBeInTheDocument();
    expect(dialog.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("requires a role before calling the API", async () => {
    const fetchSpy = mockApi({ "GET /api/auth/me": () => ({ status: 200, body: admin }) });
    renderApp("/app/users/new");

    await userEvent.type(await screen.findByLabelText("Email"), "ana@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Choose a staff role.")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("tells non-admins they don't have access", async () => {
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
    renderApp("/app/users/new");

    expect(await screen.findByText(/don't have access/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });
});
