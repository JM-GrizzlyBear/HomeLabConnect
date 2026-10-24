import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const medTeamUser = {
  ...sampleUser,
  role: "med_team" as const,
  permissions: ["leave.request", "shifts.view_own"],
};

const leave = (overrides: Record<string, unknown> = {}) => ({
  id: "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d",
  userId: "4e5f6071-8293-4a4b-bdce-3f4a5b6c7d8e",
  requesterName: "Paolo Garcia",
  type: "vacation",
  startsOn: "2099-10-12",
  endsOn: "2099-10-16",
  reason: "Family trip",
  status: "pending",
  chain: ["team_lead", "admin"],
  waitingFor: "team_lead",
  decisions: [],
  ...overrides,
});

describe("MyLeavePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows each request's status and where it is in the chain", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: medTeamUser }),
      "GET /api/leave/mine": () => ({
        status: 200,
        body: [
          leave({
            waitingFor: "admin",
            decisions: [
              {
                step: 0,
                approverName: "Juan Dela Cruz",
                decision: "approved",
                note: "Covered",
                decidedAt: "2099-10-01T02:00:00.000Z",
              },
            ],
          }),
        ],
      }),
      "GET /api/leave/inbox": () => ({ status: 200, body: [] }),
    });
    renderApp("/app/scheduling/my-leave");

    const steps = within(await screen.findByRole("list", { name: "Approval steps" }));
    expect(steps.getByText(/approved by Juan Dela Cruz/)).toBeInTheDocument();
    expect(steps.getByText("waiting")).toBeInTheDocument();
    expect(screen.getByText("Oct 12 – Oct 16, 2099 · 5 days")).toBeInTheDocument();
    expect(screen.queryByText("Waiting for your approval")).not.toBeInTheDocument();
  });

  it("requests leave through the dialog", async () => {
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: medTeamUser }),
      "GET /api/leave/mine": () => ({ status: 200, body: sent ? [leave()] : [] }),
      "GET /api/leave/inbox": () => ({ status: 200, body: [] }),
      "POST /api/leave": (body) => {
        sent = body;
        return { status: 201, body: leave() };
      },
    });
    renderApp("/app/scheduling/my-leave");

    await userEvent.click(await screen.findByRole("button", { name: "Request leave" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("radio", { name: "Sick" }));
    await userEvent.click(dialog.getByLabelText("First day"));
    const calendar = within(screen.getAllByRole("dialog").at(-1)!);
    await userEvent.click(calendar.getAllByRole("button", { name: / 20th, / })[0]!);
    await userEvent.type(dialog.getByRole("textbox", { name: "Reason" }), "Flu");
    await userEvent.click(dialog.getByRole("button", { name: "Send request" }));

    expect(await toasts().findByText("Leave requested")).toBeInTheDocument();
    const body = sent as { type: string; startsOn: string; endsOn: string; reason: string };
    expect(body).toMatchObject({ type: "sick", reason: "Flu" });
    // A one-day request: the last day follows the first.
    expect(body.endsOn).toBe(body.startsOn);
  });

  it("lets a team lead approve their team's request from My Leave", async () => {
    let decided: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: medTeamUser }),
      "GET /api/leave/mine": () => ({ status: 200, body: [] }),
      "GET /api/leave/inbox": () => ({ status: 200, body: decided ? [] : [leave()] }),
      [`POST /api/leave/${leave().id}/decision`]: (body) => {
        decided = body;
        return { status: 200, body: leave({ waitingFor: "admin" }) };
      },
    });
    renderApp("/app/scheduling/my-leave");

    expect(await screen.findByText("Waiting for your approval")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.type(dialog.getByRole("textbox", { name: /Note/ }), "Covered by Mia");
    await userEvent.click(dialog.getByRole("button", { name: "Approve" }));

    expect(await toasts().findByText("Leave approved")).toBeInTheDocument();
    expect(toasts().getByText("It now goes to admin.")).toBeInTheDocument();
    expect(decided).toEqual({ decision: "approved", note: "Covered by Mia" });
  });
});

describe("LeaveRequestsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows admins what's waiting and everyone's requests", async () => {
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/leave/inbox": () => ({
        status: 200,
        body: [leave({ chain: ["admin"], waitingFor: "admin" })],
      }),
      "GET /api/leave?status=pending": () => ({
        status: 200,
        body: [
          leave(),
          leave({ id: "8b9c0d1e-2f3a-4b4c-9d5e-6f7a8b9c0d1e", requesterName: "Maria Santos" }),
        ],
      }),
    });
    renderApp("/app/scheduling/leave");

    expect(await screen.findByRole("tab", { name: "Waiting for me (1)" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "All requests" }));
    expect(await screen.findByText(/Maria Santos/)).toBeInTheDocument();
  });

  it("rejects with a note", async () => {
    let decided: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      "GET /api/leave/inbox": () => ({
        status: 200,
        body: decided ? [] : [leave({ chain: ["admin"], waitingFor: "admin" })],
      }),
      "GET /api/leave?status=pending": () => ({ status: 200, body: [] }),
      [`POST /api/leave/${leave().id}/decision`]: (body) => {
        decided = body;
        return { status: 200, body: leave({ status: "rejected", waitingFor: null }) };
      },
    });
    renderApp("/app/scheduling/leave");

    await userEvent.click(await screen.findByRole("button", { name: "Reject" }));
    const dialog = within(await screen.findByRole("dialog"));
    await userEvent.type(dialog.getByRole("textbox", { name: "Note" }), "Short-staffed");
    await userEvent.click(dialog.getByRole("button", { name: "Reject" }));

    expect(await toasts().findByText("Leave rejected")).toBeInTheDocument();
    expect(decided).toEqual({ decision: "rejected", note: "Short-staffed" });
    expect(await screen.findByText("Nothing is waiting for you.")).toBeInTheDocument();
  });
});
