import type { Role } from "@homelabconnect/shared";
import type { User } from "../../domain/entities/user";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: Role;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string | null;
  avatar: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  touchLastLogin(id: string): Promise<void>;
}
