import type {
  Patient,
  UpdatePatientProfileInput,
} from "@homelabconnect/shared";
import { NotFoundError } from "../../domain/error";
import type { PatientRepository } from "../ports/patient-repository";

export class UpdatePatientProfileUseCase {
  constructor(private readonly patients: PatientRepository) {}

  async exec(
    userId: string,
    input: UpdatePatientProfileInput,
  ): Promise<Patient> {
    const existing = await this.patients.findByUserId(userId);
    if (!existing) throw new NotFoundError("Patient profile not found");
    return this.patients.updateByUserId(userId, input);
  }
}
