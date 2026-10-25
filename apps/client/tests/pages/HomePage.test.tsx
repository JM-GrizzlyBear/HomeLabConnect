import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockApi, renderApp, sampleUser } from "../support/renderApp";

describe("HomePage", () => {
  it("introduces the service and sends guests to sign up or sign in", async () => {
    mockApi({});
    renderApp("/");

    expect(
      await screen.findByRole("heading", { name: /Lab tests at home\.\s*Results online\./ }),
    ).toBeInTheDocument();
    const header = within(screen.getByRole("banner"));
    expect(await header.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(header.getByRole("link", { name: "Book a home visit" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("shows the steps, popular tests and the senior & PWD discount", async () => {
    mockApi({});
    renderApp("/");

    expect(await screen.findByText("Book online")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Complete Blood Count" })).toBeInTheDocument();
    expect(screen.getByText("₱1,200")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "20% off every test for seniors and persons with disability",
      }),
    ).toBeInTheDocument();
  });

  it("opens an FAQ answer", async () => {
    mockApi({});
    renderApp("/");

    await userEvent.click(await screen.findByText("How far ahead do I need to book?"));

    expect(screen.getByText(/Book at least 24 hours before your visit/)).toBeVisible();
  });

  it("takes a signed-in patient straight to booking and their account", async () => {
    mockApi({ "GET /api/auth/me": () => ({ status: 200, body: sampleUser }) });
    renderApp("/");

    const header = within(screen.getByRole("banner"));
    expect(await header.findByRole("link", { name: "My account" })).toHaveAttribute("href", "/app");
    expect(header.getByRole("link", { name: "Book a home visit" })).toHaveAttribute(
      "href",
      "/app/appointments/book",
    );
  });

  it("opens the phone menu with the section links and sign in", async () => {
    mockApi({});
    renderApp("/");

    await userEvent.click(await screen.findByRole("button", { name: "Open menu" }));

    const menu = within(await screen.findByRole("dialog"));
    expect(menu.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "#faq");
    expect(menu.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});
