import type {
  CreatePatientProfileInput,
  Patient,
  UpdatePatientProfileInput,
} from "@homelabconnect/shared";

export interface PatientRepository {
  findByUserId(userId: string): Promise<Patient | null>;
  createByUserId(
    userId: string,
    data: CreatePatientProfileInput,
  ): Promise<Patient>;
  updateByUserId(
    userId: string,
    data: UpdatePatientProfileInput,
  ): Promise<Patient>;
}
