import { describe, expect, it } from "vitest";
import {
  approvalChain,
  type Approver,
  assertNoOverlap,
  cancel,
  canDecide,
  checkLeaveDetails,
  decide,
  type LeaveRequest,
} from "../../../../src/domain/scheduling/leave.js";
import {
  InvalidLeave,
  LeaveNotCancellable,
  LeaveOverlap,
  NotYourLeaveStep,
} from "../../../../src/domain/scheduling/schedulingErrors.js";

const TODAY = "2026-10-01";
const vacation = {
  type: "vacation" as const,
  startsOn: "2026-10-12",
  endsOn: "2026-10-16",
  reason: "Family trip",
};
const makati = {
  teamId: "makati",
  periodStart: "2026-09-28",
  leadUserId: "juan",
  memberIds: ["juan", "paolo"],
};

const request = (changes: Partial<LeaveRequest> = {}): LeaveRequest => ({
  id: "r1",
  userId: "paolo",
  ...vacation,
  status: "pending",
  chain: ["team_lead", "admin"],
  currentStep: 0,
  teamLeadId: "juan",
  decisions: [],
  ...changes,
});

const approver = (id: string, role: Approver["role"], permissions: string[] = []): Approver => ({
  id,
  role,
  permissions: new Set(permissions),
});
const juan = approver("juan", "med_team");
const seniorMedTech = approver("mia", "med_team", ["leave.approve"]);
const admin = approver("admin", "admin", ["leave.approve"]);

describe("checkLeaveDetails", () => {
  it("accepts a future request and trims the reason", () => {
    expect(checkLeaveDetails({ ...vacation, reason: "  Family trip " }, TODAY).reason).toBe(
      "Family trip",
    );
  });

  it("lets sick leave start up to 7 days back, but not vacation", () => {
    const lastWeek = { startsOn: "2026-09-24", endsOn: "2026-09-25" };
    expect(() =>
      checkLeaveDetails({ ...vacation, ...lastWeek, type: "sick" }, TODAY),
    ).not.toThrow();
    expect(() => checkLeaveDetails({ ...vacation, ...lastWeek }, TODAY)).toThrow(InvalidLeave);
    expect(() =>
      checkLeaveDetails(
        { ...vacation, type: "sick", startsOn: "2026-09-23", endsOn: "2026-09-23" },
        TODAY,
      ),
    ).toThrow(InvalidLeave);
  });

  it.each([
    ["an end before the start", { startsOn: "2026-10-16", endsOn: "2026-10-12" }],
    ["more than 30 days", { startsOn: "2026-10-01", endsOn: "2026-10-31" }],
    ["a blank reason", { reason: "  " }],
  ])("refuses %s", (_label, change) => {
    expect(() => checkLeaveDetails({ ...vacation, ...change }, TODAY)).toThrow(InvalidLeave);
  });

  it("refuses overlapping pending or approved leave, but not rejected", () => {
    expect(() =>
      assertNoOverlap(vacation, [request({ startsOn: "2026-10-16", endsOn: "2026-10-20" })]),
    ).toThrow(LeaveOverlap);
    expect(() => assertNoOverlap(vacation, [request({ status: "rejected" })])).not.toThrow();
  });
});

describe("approvalChain", () => {
  it("sends a med team member to their lead, then admin", () => {
    expect(approvalChain({ id: "paolo", role: "med_team" }, makati)).toEqual({
      chain: ["team_lead", "admin"],
      teamLeadId: "juan",
    });
  });

  it.each([
    ["the team lead", { id: "juan", role: "med_team" as const }, makati],
    ["med team on no team", { id: "paolo", role: "med_team" as const }, null],
    ["a doctor", { id: "maria", role: "doctor" as const }, null],
    ["support", { id: "ana", role: "support" as const }, null],
  ])("sends %s straight to admin", (_label, requester, roster) => {
    expect(approvalChain(requester, roster).chain).toEqual(["admin"]);
  });
});

describe("deciding", () => {
  it("lets the lead or a Senior Med Tech decide the first step, but not an admin or the requester", () => {
    expect(canDecide(request(), juan)).toBe(true);
    expect(canDecide(request(), seniorMedTech)).toBe(true);
    expect(canDecide(request(), admin)).toBe(false);
    expect(canDecide(request(), approver("paolo", "med_team", ["leave.approve"]))).toBe(false);
  });

  it("goes lead → admin → approved", () => {
    const now = new Date("2026-10-01T02:00:00Z");
    const afterLead = decide(request(), juan, "approved", "Enjoy", now);
    expect(afterLead).toMatchObject({ status: "pending", currentStep: 1 });
    expect(() => decide(afterLead, juan, "approved", null, now)).toThrow(NotYourLeaveStep);

    const final = decide(afterLead, admin, "approved", null, now);
    expect(final.status).toBe("approved");
    expect(final.decisions.map((decision) => decision.approverId)).toEqual(["juan", "admin"]);
  });

  it("ends at the first rejection", () => {
    const rejected = decide(request(), juan, "rejected", "Short-staffed that week", new Date());
    expect(rejected.status).toBe("rejected");
  });
});

describe("cancel", () => {
  it("cancels pending leave, or approved leave that hasn't started", () => {
    expect(cancel(request(), "paolo", TODAY).status).toBe("cancelled");
    expect(cancel(request({ status: "approved" }), "paolo", TODAY).status).toBe("cancelled");
  });

  it("refuses started or rejected leave, and other people", () => {
    expect(() => cancel(request({ status: "approved" }), "paolo", "2026-10-13")).toThrow(
      LeaveNotCancellable,
    );
    expect(() => cancel(request({ status: "rejected" }), "paolo", TODAY)).toThrow(
      LeaveNotCancellable,
    );
    expect(() => cancel(request(), "juan", TODAY)).toThrow(LeaveNotCancellable);
  });
});
