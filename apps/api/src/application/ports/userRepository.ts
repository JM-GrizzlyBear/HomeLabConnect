import type { PatientDetails, ProfileChanges } from "../../domain/identity/profile.js";
import type { User } from "../../domain/identity/user.js";

export interface NewPatientAccount {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string | null;
  address: string | null;
}

/** A user with their role-specific details. `patient` is null for staff. */
export interface UserProfile {
  user: User;
  patient: PatientDetails | null;
}

/** Port: stores and loads user accounts. Emails are passed in already normalised. */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findProfile(id: string): Promise<UserProfile | null>;
  /** Creates the user and its patient profile together. Throws EmailAlreadyTaken on a duplicate. */
  createPatientAccount(account: NewPatientAccount): Promise<User>;
  recordSignIn(userId: string, at: Date): Promise<void>;
  /** Stores a new password hash and clears the temporary-password flag. */
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  /** Saves the user's fields and, when `changes.patient` is set, their patient details. */
  updateProfile(userId: string, changes: ProfileChanges): Promise<void>;
}
