import type { Role } from "@homelabconnect/shared";

export interface UserSeed {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  emailVerified: boolean;
}

export const SEED_USERS: UserSeed[] = [
  {
    email: "patient@homelabconnect.local",
    password: "patient123",
    role: "patient",
    firstName: "Patient",
    lastName: "User",
    middleName: null,
    phone: null,
    avatar: null,
    isActive: true,
    emailVerified: true,
  },
  {
    email: "admin@homelabconnect.local",
    password: "admin123",
    role: "admin",
    firstName: "Admin",
    lastName: "User",
    middleName: null,
    phone: null,
    avatar: null,
    isActive: true,
    emailVerified: true,
  },
  {
    email: "medteam@homelabconnect.local",
    password: "medteam123",
    role: "med_team",
    firstName: "Medic",
    lastName: "Team",
    middleName: null,
    phone: null,
    avatar: null,
    isActive: true,
    emailVerified: true,
  },
  {
    email: "doctor@homelabconnect.local",
    password: "doctor123",
    role: "doctor",
    firstName: "Doctor",
    lastName: "User",
    middleName: null,
    phone: null,
    avatar: null,
    isActive: true,
    emailVerified: true,
  },
  {
    email: "superadmin@homelabconnect.local",
    password: "superadmin123",
    role: "admin",
    firstName: "Super",
    lastName: "Admin",
    middleName: null,
    phone: null,
    avatar: null,
    isActive: true,
    emailVerified: true,
  },
];
