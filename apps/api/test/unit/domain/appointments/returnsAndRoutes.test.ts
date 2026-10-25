import { describe, expect, it } from "vitest";
import { isSameVisits, missedTests } from "../../../../src/domain/appointments/appointment.js";
import { detectAttachmentType } from "../../../../src/domain/media/photo.js";

const line = (code: string, collected: boolean | null) => ({
  procedureId: code,
  code,
  name: code,
  priceCentavos: 35_000,
  promotionId: null,
  promotionName: null,
  discountCentavos: 0,
  collected,
});

describe("missedTests", () => {
  it("returns the tests not collected, every test when nothing was, none otherwise", () => {
    const lines = [line("CBC", true), line("LIPID", false)];
    expect(missedTests({ status: "collected", lines }).map((l) => l.code)).toEqual(["LIPID"]);
    expect(missedTests({ status: "not_collected", lines }).map((l) => l.code)).toEqual([
      "CBC",
      "LIPID",
    ]);
    expect(missedTests({ status: "collected", lines: [line("CBC", true)] })).toEqual([]);
    expect(missedTests({ status: "confirmed", lines })).toEqual([]);
  });
});

describe("isSameVisits", () => {
  it("needs each of the day's visits exactly once", () => {
    expect(isSameVisits(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
    expect(isSameVisits(["a", "b"], ["a"])).toBe(false);
    expect(isSameVisits(["a", "b"], ["a", "a"])).toBe(false);
    expect(isSameVisits(["a", "b"], ["a", "x"])).toBe(false);
  });
});

describe("detectAttachmentType", () => {
  it("reads PDFs and photos from their first bytes, and refuses anything else", () => {
    const ascii = (text: string) => new Uint8Array([...text].map((char) => char.charCodeAt(0)));
    expect(detectAttachmentType(ascii("%PDF-1.7 ..."))).toBe("application/pdf");
    expect(detectAttachmentType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectAttachmentType(ascii("hello"))).toBeNull();
  });
});
