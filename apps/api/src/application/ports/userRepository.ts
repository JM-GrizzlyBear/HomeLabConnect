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

/** Port: stores and loads user accounts. Emails are passed in already normalised. */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** Creates the user and its patient profile together. Throws EmailAlreadyTaken on a duplicate. */
  createPatientAccount(account: NewPatientAccount): Promise<User>;
  recordSignIn(userId: string, at: Date): Promise<void>;
}
