import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser } from "../../support/renderApp";

const admin = adminUser;

function signedInAs(user: typeof sampleUser | typeof admin) {
  localStorage.setItem("homelabconnect.token", "tkn");
  mockApi({
    "GET /api/auth/me": () => ({ status: 200, body: user }),
    "POST /api/auth/logout": () => ({ status: 204 }),
  });
}

const mainNav = () => within(screen.getByRole("navigation", { name: "Main" }));

describe("Sidebar", () => {
  beforeEach(() => localStorage.clear());

  it("shows the user's profile and only their role's menu", async () => {
    signedInAs(sampleUser);
    renderApp("/app");

    expect(await screen.findByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(mainNav().getByRole("button", { name: "Appointments" })).toBeInTheDocument();
    expect(mainNav().queryByRole("button", { name: "Users" })).not.toBeInTheDocument();
    expect(mainNav().queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("expands a group to reveal its pages", async () => {
    signedInAs(admin);
    renderApp("/app");

    const users = await screen.findByRole("button", { name: "Users" });
    expect(users).toHaveAttribute("aria-expanded", "false");
    expect(mainNav().queryByRole("link", { name: "All Users" })).not.toBeInTheDocument();

    await userEvent.click(users);

    expect(users).toHaveAttribute("aria-expanded", "true");
    expect(mainNav().getByRole("link", { name: "All Users" })).toBeInTheDocument();
    expect(mainNav().getByRole("link", { name: "Reports" })).toBeInTheDocument();
  });

  it("opens the group of the current page and marks the page active", async () => {
    signedInAs(admin);
    renderApp("/app/scheduling/shifts");

    expect(await screen.findByRole("button", { name: "Scheduling" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(mainNav().getByRole("link", { name: "Shifts" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText(/coming soon/)).toBeInTheDocument();
  });

  it("tells a patient they can't open an admin page", async () => {
    signedInAs(sampleUser);
    renderApp("/app/users/all");

    expect(await screen.findByText(/don't have access/)).toBeInTheDocument();
  });

  it("logs out from the sidebar", async () => {
    signedInAs(admin);
    const router = renderApp("/app");

    await userEvent.click(await screen.findByRole("button", { name: "Account menu" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Log out" }));

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });
});
