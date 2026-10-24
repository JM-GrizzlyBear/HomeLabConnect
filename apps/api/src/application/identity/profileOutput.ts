import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { PatientDetails } from "../../domain/identity/profile.js";
import type { UserProfile } from "../../domain/identity/UserRepository.js";

/** What profile use cases return: never the password hash. */
export interface ProfileOutput {
  id: string;
  email: string;
  role: BaseRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  patient: PatientDetails | null;
}

export function toProfileOutput({ user, patient }: UserProfile): ProfileOutput {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    patient,
  };
}
