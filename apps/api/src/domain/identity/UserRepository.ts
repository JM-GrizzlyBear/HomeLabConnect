import type { BaseRole, StaffRole } from "./baseRole.js";
import type { PatientDetails, ProfileChanges } from "./profile.js";
import type { StoredPhoto } from "../media/photo.js";
import type { User } from "./user.js";

export interface NewPatientAccount {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string | null;
  address: string | null;
}

/** A staff account starts on a temporary password that must be changed on first sign-in. */
export interface NewStaffAccount {
  email: string;
  passwordHash: string;
  role: StaffRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  hiredOn: string | null;
  temporaryPasswordExpiresAt: Date;
  customRoleId: string | null;
}

/** A user with their role-specific details. `patient` is null for staff. */
export interface UserProfile {
  user: User;
  patient: PatientDetails | null;
}

export interface UserListQuery {
  /** Matches email, first name or last name, ignoring case. */
  search: string | null;
  role: BaseRole | null;
  isActive: boolean | null;
  page: number;
  pageSize: number;
}

/** A user row for the admin list, with the sign-in dates the entity doesn't carry. */
export interface UserListItem {
  user: User;
  customRole: { id: string; name: string } | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface UserListPage {
  items: UserListItem[];
  total: number;
}

/** Port: stores and loads user accounts. Emails are passed in already normalised. */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findProfile(id: string): Promise<UserProfile | null>;
  /** Newest accounts first. */
  list(query: UserListQuery): Promise<UserListPage>;
  findListItem(id: string): Promise<UserListItem | null>;
  /** Creates the user and its patient profile together. Throws EmailAlreadyTaken on a duplicate. */
  createPatientAccount(account: NewPatientAccount): Promise<User>;
  /** Creates the user and its employee profile together. Throws EmailAlreadyTaken on a duplicate. */
  createStaffAccount(account: NewStaffAccount): Promise<User>;
  recordSignIn(userId: string, at: Date): Promise<void>;
  /** Stores a new password hash and clears the temporary-password flag and expiry. */
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  /** Stores a temporary password hash that must be changed before `expiresAt`. */
  setTemporaryPassword(userId: string, passwordHash: string, expiresAt: Date): Promise<void>;
  setActive(userId: string, isActive: boolean): Promise<void>;
  /** Puts the user on a custom role, or back on the plain base role with null. */
  setCustomRole(userId: string, customRoleId: string | null): Promise<void>;
  /** Saves the user's fields and, when `changes.patient` is set, their patient details. */
  updateProfile(userId: string, changes: ProfileChanges): Promise<void>;
  /** An admin's correction of the basics. Throws EmailAlreadyTaken on a duplicate email. */
  updateAccount(
    userId: string,
    changes: { firstName: string; lastName: string; phone: string | null; email: string },
  ): Promise<void>;
  /** Sets or (with null) clears the profile photo. */
  setPhoto(userId: string, photo: StoredPhoto | null): Promise<void>;
}
