import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../support/renderApp";

const tempUser = { ...sampleUser, mustChangePassword: true };

async function fillForm(current: string, next: string, confirm = next) {
  await userEvent.type(await screen.findByLabelText("Current password"), current);
  await userEvent.type(screen.getByLabelText("New password"), next);
  await userEvent.type(screen.getByLabelText("Confirm new password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Save and continue" }));
}

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("changes the temporary password and continues to the app", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: tempUser }),
      "PUT /api/auth/password": (body) => {
        sent = body;
        return { status: 200, body: sampleUser };
      },
    });
    const router = renderApp("/change-password");

    await fillForm("Temp1234", "NewPassword456");

    expect(await screen.findByText("Welcome back, Juan")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/app");
    // The confirmation stays in the browser.
    expect(sent).toEqual({ currentPassword: "Temp1234", newPassword: "NewPassword456" });
  });

  it("checks the confirmation without calling the API", async () => {
    const fetchSpy = mockApi({ "GET /api/auth/me": () => ({ status: 200, body: tempUser }) });
    renderApp("/change-password");

    await fillForm("Temp1234", "NewPassword456", "Different456");

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalledWith("/api/auth/password", expect.anything());
  });

  it("marks a wrong current password", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: tempUser }),
      "PUT /api/auth/password": () => ({
        status: 400,
        body: {
          error: { code: "incorrect_current_password", message: "Current password is incorrect." },
        },
      }),
    });
    renderApp("/change-password");

    await fillForm("Wrong1234", "NewPassword456");

    expect(await screen.findByText("Current password is incorrect.")).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveAttribute("aria-invalid", "true");
  });

  it("sends a user who doesn't need a new password to the app", async () => {
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
    const router = renderApp("/change-password");

    expect(await screen.findByText("Welcome back, Juan")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/app");
  });
});
