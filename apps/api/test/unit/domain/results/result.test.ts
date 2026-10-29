import { describe, expect, it } from "vitest";
import type { AppointmentLine } from "../../../../src/domain/appointments/appointment.js";
import {
  assertCanRelease,
  assertCanUpload,
  resultsState,
  type TestResult,
} from "../../../../src/domain/results/result.js";
import { ResultNotAllowed } from "../../../../src/domain/results/resultErrors.js";

const line = (procedureId: string, collected: boolean | null): AppointmentLine => ({
  procedureId,
  code: procedureId.toUpperCase(),
  name: procedureId,
  priceCentavos: 35_000,
  promotionId: null,
  promotionName: null,
  discountCentavos: 0,
  collected,
});

const result = (procedureId: string, releasedAt: Date | null = null): TestResult => ({
  id: `r-${procedureId}`,
  appointmentId: "a1",
  procedureId,
  file: { filename: "r.pdf", mimeType: "application/pdf", sizeBytes: 10, storageKey: "k" },
  comment: null,
  uploadedBy: { id: "d1", name: "Doc" },
  uploadedAt: new Date("2026-01-18T00:00:00Z"),
  releasedAt,
});

const collected = {
  status: "collected" as const,
  lines: [line("cbc", true), line("lipid", false)],
};

describe("results", () => {
  it("are uploaded for collected tests of a collected visit, until released", () => {
    expect(assertCanUpload(collected, "cbc", []).code).toBe("CBC");
    expect(() => assertCanUpload(collected, "lipid", [])).toThrow("wasn't collected");
    expect(() =>
      assertCanUpload({ status: "on_the_way", lines: collected.lines }, "cbc", []),
    ).toThrow(ResultNotAllowed);
    expect(() => assertCanUpload(collected, "cbc", [result("cbc", new Date())])).toThrow(
      "already released",
    );
  });

  it("are released once every collected test has one", () => {
    expect(() => assertCanRelease(collected, [])).toThrow("missing: CBC");
    expect(() => assertCanRelease(collected, [result("cbc")])).not.toThrow();
    expect(() => assertCanRelease(collected, [result("cbc", new Date())])).toThrow(
      "already released",
    );
  });

  it("stay locked until the visit is paid", () => {
    const visit = { status: "collected" as const, paymentStatus: "unpaid" as const };
    expect(resultsState({ ...visit, status: "confirmed" }, [])).toBe("none");
    expect(resultsState(visit, [result("cbc")])).toBe("pending");
    expect(resultsState(visit, [result("cbc", new Date())])).toBe("locked");
    expect(resultsState({ ...visit, paymentStatus: "paid" }, [result("cbc", new Date())])).toBe(
      "ready",
    );
  });
});
