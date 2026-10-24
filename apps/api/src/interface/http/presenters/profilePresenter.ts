import type { Profile } from "@homelabconnect/shared";
import type { ProfileOutput } from "../../../application/identity/profileOutput.js";
import type { HttpResponse } from "../httpTypes.js";

export function presentProfile(output: ProfileOutput): HttpResponse<Profile> {
  return {
    status: 200,
    body: {
      id: output.id,
      email: output.email,
      role: output.role,
      firstName: output.firstName,
      lastName: output.lastName,
      phone: output.phone,
      patient: output.patient && {
        birthDate: output.patient.birthDate,
        address: output.patient.address,
      },
    },
  };
}
