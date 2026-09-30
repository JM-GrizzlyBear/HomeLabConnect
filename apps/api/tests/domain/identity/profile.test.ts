import { describe, expect, it } from "vitest";
import {
  PatientDetailsNotAllowed,
  PhoneRequired,
} from "../../../src/domain/identity/identityErrors.js";
import { assertProfileFitsRole } from "../../../src/domain/identity/profile.js";

const changes = { firstName: "Juan", lastName: "Cruz", phone: "09171234567", patient: null };

describe("assertProfileFitsRole", () => {
  it("accepts a patient with a phone and details", () => {
    expect(() =>
      assertProfileFitsRole("patient", {
        ...changes,
        patient: { birthDate: "1990-05-01", address: null },
      }),
    ).not.toThrow();
  });

  it("requires patients to have a phone", () => {
    expect(() => assertProfileFitsRole("patient", { ...changes, phone: null })).toThrow(
      PhoneRequired,
    );
  });

  it("lets staff go without a phone but not patient details", () => {
    expect(() => assertProfileFitsRole("admin", { ...changes, phone: null })).not.toThrow();
    expect(() =>
      assertProfileFitsRole("med_team", {
        ...changes,
        patient: { birthDate: null, address: "Makati" },
      }),
    ).toThrow(PatientDetailsNotAllowed);
  });
});
