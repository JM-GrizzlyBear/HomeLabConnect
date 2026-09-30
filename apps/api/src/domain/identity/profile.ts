import type { BaseRole } from "./baseRole.js";
import { PatientDetailsNotAllowed, PhoneRequired } from "./identityErrors.js";

/** Patient-only details, kept apart from the fields every user has. */
export interface PatientDetails {
  birthDate: string | null;
  address: string | null;
}

/** The editable part of a user's profile. `patient` null means "leave as is". */
export interface ProfileChanges {
  firstName: string;
  lastName: string;
  phone: string | null;
  patient: PatientDetails | null;
}

/**
 * Business rules for editing a profile: patients must keep a phone number the
 * med team can call, and only patients have patient details.
 */
export function assertProfileFitsRole(role: BaseRole, changes: ProfileChanges): void {
  if (role === "patient" && !changes.phone) throw new PhoneRequired();
  if (role !== "patient" && changes.patient) throw new PatientDetailsNotAllowed();
}
