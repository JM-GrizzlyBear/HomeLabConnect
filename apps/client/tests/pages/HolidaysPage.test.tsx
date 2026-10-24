import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const year = new Date().getFullYear();
const LIST = `GET /api/holidays?year=${year}`;

const christmas = {
  id: "1b2c3d4e-5f60-4718-8a9b-0c1d2e3f4a5b",
  date: "2025-12-25",
  name: "Christmas Day",
  kind: "holiday",
  repeatsYearly: true,
};
const outing = {
  id: "2c3d4e5f-6071-4829-9bac-1d2e3f4a5b6c",
  date: `${year}-03-06`,
  name: "Company outing",
  kind: "special_day_off",
  repeatsYearly: false,
};

describe("HolidaysPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lists closed days by month, with yearly ones moved into this year", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [LIST]: () => ({ status: 200, body: [christmas, outing] }),
    });
    renderApp("/app/scheduling/holidays");

    const row = (await screen.findByText("Christmas Day")).closest("li")!;
    expect(within(row).getByText("Yearly")).toBeInTheDocument();
    expect(within(row).getByText(/Dec 25/)).toBeInTheDocument();
    const december = screen.getByRole("region", { name: `December ${year}` });
    expect(within(december).getByText("Christmas Day")).toBeInTheDocument();
    expect(
      within(screen.getByText("Company outing").closest("li")!).getByText("Special day off"),
    ).toBeInTheDocument();
  });

  it("adds a closed day through the dialog", async () => {
    let added = false;
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [LIST]: () => ({ status: 200, body: added ? [christmas, outing] : [christmas] }),
      "POST /api/holidays": (body) => {
        added = true;
        sent = body;
        return { status: 201, body: outing };
      },
    });
    renderApp("/app/scheduling/holidays");

    await userEvent.click(await screen.findByRole("button", { name: "Add closed day" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.type(dialog.getByRole("textbox", { name: "Name" }), "Company outing");
    await userEvent.click(dialog.getByLabelText("Date"));
    const calendar = within(screen.getAllByRole("dialog").at(-1)!);
    await userEvent.click(calendar.getAllByRole("button", { name: / 6th, / })[0]!);
    await userEvent.click(dialog.getByRole("radio", { name: "Special day off" }));
    await userEvent.click(dialog.getByRole("button", { name: "Add closed day" }));

    expect(await toasts().findByText("Closed day added")).toBeInTheDocument();
    expect(sent).toMatchObject({
      name: "Company outing",
      kind: "special_day_off",
      repeatsYearly: false,
    });
    expect(await screen.findByText("Company outing")).toBeInTheDocument();
  });

  it("shows an already-closed date under the date field", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [LIST]: () => ({ status: 200, body: [christmas] }),
      [`PUT /api/holidays/${christmas.id}`]: () => ({
        status: 409,
        body: {
          error: {
            code: "closed_day_exists",
            message: "That day is already closed (Company outing).",
          },
        },
      }),
    });
    renderApp("/app/scheduling/holidays");

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Christmas Day" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Save" }),
    );

    expect(await screen.findByText(/already closed \(Company outing\)/)).toBeInTheDocument();
  });

  it("removes a closed day after confirming", async () => {
    let removed = false;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [LIST]: () => ({ status: 200, body: removed ? [] : [outing] }),
      [`DELETE /api/holidays/${outing.id}`]: () => {
        removed = true;
        return { status: 204 };
      },
    });
    renderApp("/app/scheduling/holidays");

    await userEvent.click(
      await screen.findByRole("button", { name: "Actions for Company outing" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Remove" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Remove" }),
    );

    expect(await toasts().findByText("Closed day removed")).toBeInTheDocument();
    expect(await screen.findByText(`Nothing is closed in ${year}.`)).toBeInTheDocument();
  });

  it("lets med team see closed days without changing them", async () => {
    mockApi({
      "GET /api/auth/me": () => ({
        status: 200,
        body: { ...sampleUser, role: "med_team", permissions: ["holidays.view"] },
      }),
      [LIST]: () => ({ status: 200, body: [christmas] }),
    });
    renderApp("/app/scheduling/holidays");

    expect(await screen.findByText("Christmas Day")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add closed day" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Actions for Christmas Day" }),
    ).not.toBeInTheDocument();
  });
});
