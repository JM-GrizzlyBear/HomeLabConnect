import { describe, expect, it } from "vitest";
import { RecordAuditEntry } from "../../../../src/application/audit/RecordAuditEntry.js";
import type { AuditLog, NewAuditEntry } from "../../../../src/domain/audit/auditEntry.js";
import { AuditedController } from "../../../../src/interface/http/AuditedController.js";
import type { HttpRequest, HttpResponse } from "../../../../src/interface/http/httpTypes.js";
import { FixedClock } from "../../../support/fakes.js";

function setup(respond: () => Promise<HttpResponse>) {
  const written: NewAuditEntry[] = [];
  const log: AuditLog = {
    record: async (entry) => {
      written.push(entry);
    },
    list: async () => ({ items: [], total: 0 }),
  };
  const record = new RecordAuditEntry(log, new FixedClock());
  const request: HttpRequest = {
    body: { name: "Team Pasig", password: "secret-1" },
    params: { id: "t1" },
    query: {},
    headers: { "user-agent": "TestBrowser" },
    ip: "10.0.0.1",
    session: { id: "s1", userId: "u1" },
    auth: { userId: "u1" } as HttpRequest["auth"],
  };
  return { written, record, request, inner: { handle: respond } };
}

describe("AuditedController", () => {
  it("records a successful call, with telling fields but never a password", async () => {
    const { written, record, request, inner } = setup(async () => ({ status: 200, body: {} }));
    await new AuditedController(inner, record, "teams.update", { target: "team" }).handle(request);
    expect(written).toEqual([
      {
        actorId: "u1",
        action: "teams.update",
        targetType: "team",
        targetId: "t1",
        summary: "name: Team Pasig",
        ip: "10.0.0.1",
        userAgent: "TestBrowser",
        at: expect.any(Date),
      },
    ]);
  });

  it("records nothing when the call fails, unless asked to", async () => {
    const failing = async (): Promise<HttpResponse> => {
      throw new Error("refused");
    };
    const quiet = setup(failing);
    await expect(
      new AuditedController(quiet.inner, quiet.record, "teams.update").handle(quiet.request),
    ).rejects.toThrow("refused");
    expect(quiet.written).toHaveLength(0);

    const loud = setup(failing);
    await expect(
      new AuditedController(loud.inner, loud.record, "auth.login", {
        recordFailure: true,
      }).handle(loud.request),
    ).rejects.toThrow("refused");
    expect(loud.written.map((entry) => entry.action)).toEqual(["auth.login_failed"]);
  });
});
