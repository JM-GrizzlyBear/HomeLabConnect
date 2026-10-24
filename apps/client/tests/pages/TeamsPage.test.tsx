import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const juan = { id: "3d4e5f60-7182-493a-acbd-2e3f4a5b6c7d", name: "Juan Dela Cruz" };
const paolo = { id: "4e5f6071-8293-4a4b-bdce-3f4a5b6c7d8e", name: "Paolo Garcia" };
const mia = { id: "5f607182-93a4-4b5c-8edf-4a5b6c7d8e9f", name: "Mia Lopez" };

const makati = {
  id: "60718293-a4b5-4c6d-9fe0-5b6c7d8e9fa0",
  name: "Team Makati",
  area: "Makati, Taguig",
  isActive: true,
  lead: juan,
  members: [juan, paolo],
};

const board = (teams: unknown[] = [makati], unassigned: unknown[] = [mia]) => ({
  status: 200,
  body: { periodStart: "2026-09-28", periodEnd: "2026-10-11", teams, unassigned },
});

const staff = () => ({
  status: 200,
  body: [
    { id: juan.id, firstName: "Juan", lastName: "Dela Cruz", role: "med_team" },
    { id: paolo.id, firstName: "Paolo", lastName: "Garcia", role: "med_team" },
    { id: mia.id, firstName: "Mia", lastName: "Lopez", role: "med_team" },
  ],
});

describe("TeamsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows each team's lead and members for the period, and who's unassigned", async () => {
    mockApi({
      "GET /api/auth/me": () => ({
        status: 200,
        body: { ...sampleUser, role: "med_team", permissions: ["teams.view"] },
      }),
      "GET /api/teams": () => board(),
    });
    renderApp("/app/scheduling/teams");

    expect(await screen.findByText("Sep 28 – Oct 11, 2026")).toBeInTheDocument();
    // The sample signed-in user is also "Juan Dela Cruz", so look inside the team's list.
    const leadRow = screen.getByText("Lead").closest("li")!;
    expect(leadRow).toHaveTextContent("Juan Dela Cruz");
    expect(screen.getByText("Paolo Garcia")).toBeInTheDocument();
    expect(screen.getByText("Mia Lopez")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Actions for Team Makati" }),
    ).not.toBeInTheDocument();
  });

  it("moves to the next two weeks", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/teams": () => board(),
      "GET /api/teams?date=2026-10-12": () => ({
        status: 200,
        body: { periodStart: "2026-10-12", periodEnd: "2026-10-25", teams: [], unassigned: [] },
      }),
    });
    renderApp("/app/scheduling/teams");

    await userEvent.click(await screen.findByRole("button", { name: "Next two weeks" }));

    expect(await screen.findByText("Oct 12 – Oct 25, 2026")).toBeInTheDocument();
  });

  it("edits a roster, moving the lead to another member", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/teams": () => board(),
      "GET /api/staff?role=med_team": staff,
      [`PUT /api/teams/${makati.id}/rosters/2026-09-28`]: (body) => {
        sent = body;
        return { status: 204 };
      },
    });
    renderApp("/app/scheduling/teams");

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Team Makati" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit roster" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.click(await dialog.findByRole("checkbox", { name: "Juan Dela Cruz" }));
    await userEvent.click(dialog.getByRole("checkbox", { name: "Mia Lopez" }));
    await userEvent.click(dialog.getByRole("combobox", { name: "Team lead" }));
    await userEvent.click(await screen.findByRole("option", { name: "Mia Lopez" }));
    await userEvent.click(dialog.getByRole("button", { name: "Save roster" }));

    expect(await toasts().findByText("Roster saved")).toBeInTheDocument();
    expect(sent).toEqual({ memberIds: [paolo.id, mia.id], leadUserId: mia.id });
  });

  it("shows a clash with another team under the members", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/teams": () => board(),
      "GET /api/staff?role=med_team": staff,
      [`PUT /api/teams/${makati.id}/rosters/2026-09-28`]: () => ({
        status: 409,
        body: {
          error: {
            code: "roster_clash",
            message: "Paolo Garcia is already on Team Quezon City for these two weeks.",
          },
        },
      }),
    });
    renderApp("/app/scheduling/teams");

    await userEvent.click(await screen.findByRole("button", { name: "Actions for Team Makati" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit roster" }));
    const dialog = within(await screen.findByRole("dialog"));
    await dialog.findByRole("checkbox", { name: "Juan Dela Cruz" });
    await userEvent.click(dialog.getByRole("button", { name: "Save roster" }));

    expect(await dialog.findByText(/already on Team Quezon City/)).toBeInTheDocument();
  });

  it("offers to copy the previous two weeks into an empty period", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/teams": () => board([{ ...makati, lead: null, members: [] }], [juan, paolo, mia]),
      "POST /api/rosters/2026-09-28/copy-previous": () => ({ status: 200, body: { copied: 1 } }),
    });
    renderApp("/app/scheduling/teams");

    await userEvent.click(await screen.findByRole("button", { name: "Copy previous two weeks" }));

    expect(await toasts().findByText("Rosters copied")).toBeInTheDocument();
  });
});
