import type {
  CreatePatientProfileInput,
  Patient,
} from "@homelabconnect/shared";
import { ConflictError } from "../../domain/error";
import type { PatientRepository } from "../ports/patient-repository";

export class CreatePatientProfileUseCase {
  constructor(private readonly patients: PatientRepository) {}

  async exec(
    userId: string,
    input: CreatePatientProfileInput,
  ): Promise<Patient> {
    const existing = await this.patients.findByUserId(userId);
    if (existing) throw new ConflictError("Patient profile already exists");
    return this.patients.createByUserId(userId, input);
  }
}
