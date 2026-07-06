import { eq } from "drizzle-orm";
import type {
  CreatePatientProfileInput,
  Patient,
  UpdatePatientProfileInput,
} from "@homelabconnect/shared";
import type { PatientRepository } from "../../../application/ports/patient-repository";
import type { Db } from "../client";
import { patients, type PatientRow } from "../schema";

function rowToPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    userId: row.userId,
    dateOfBirth: row.dateOfBirth ?? null,
    gender: row.gender ?? null,
    address1: row.address1 ?? null,
    address2: row.address2 ?? null,
    city: row.city ?? null,
    province: row.province ?? null,
    postalCode: row.postalCode ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    emergencyContactName: row.emergencyContactName ?? null,
    emergencyContactPhone: row.emergencyContactPhone ?? null,
    medicalNotes: row.medicalNotes ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class DrizzlePatientRepository implements PatientRepository {
  constructor(private readonly db: Db) {}

  async findByUserId(userId: string): Promise<Patient | null> {
    const row = await this.db.query.patients.findFirst({
      where: eq(patients.userId, userId),
    });
    return row ? rowToPatient(row) : null;
  }

  async createByUserId(
    userId: string,
    data: CreatePatientProfileInput,
  ): Promise<Patient> {
    const [row] = await this.db
      .insert(patients)
      .values({
        userId,
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data.gender ?? null,
        address1: data.address1 ?? null,
        address2: data.address2 ?? null,
        city: data.city ?? null,
        province: data.province ?? null,
        postalCode: data.postalCode ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        emergencyContactName: data.emergencyContactName ?? null,
        emergencyContactPhone: data.emergencyContactPhone ?? null,
        medicalNotes: data.medicalNotes ?? null,
      })
      .returning();

    if (!row) throw new Error("INSERT patients returned no row");
    return rowToPatient(row);
  }

  async updateByUserId(
    userId: string,
    data: UpdatePatientProfileInput,
  ): Promise<Patient> {
    const [row] = await this.db
      .update(patients)
      .set({
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data.gender ?? null,
        address1: data.address1 ?? null,
        address2: data.address2 ?? null,
        city: data.city ?? null,
        province: data.province ?? null,
        postalCode: data.postalCode ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        emergencyContactName: data.emergencyContactName ?? null,
        emergencyContactPhone: data.emergencyContactPhone ?? null,
        medicalNotes: data.medicalNotes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(patients.userId, userId))
      .returning();

    if (!row) throw new Error("UPDATE patients returned no row");
    return rowToPatient(row);
  }
}
