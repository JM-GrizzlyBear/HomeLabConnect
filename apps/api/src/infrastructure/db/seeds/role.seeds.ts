import type { Role } from "@homelabconnect/shared";

export interface RoleSeed {
  role: Role;
  description: string;
}

export const SEED_ROLES: ReadonlyArray<RoleSeed> = [
  {
    role: "patient",
    description:
      "End-user who books lab procedures, attends appointments, chats with the medical team and views their own results.",
  },
  {
    role: "med_team",
    description:
      "Clinic staff who manage appointments, perform procedures, upload results and coordinate with doctors.",
  },
  {
    role: "doctor",
    description:
      "Licensed physician who reviews results, signs off on diagnoses and communicates findings to patients.",
  },
  {
    role: "support",
    description:
      "Customer-support agent who helps patients with bookings, billing questions and general inquiries.",
  },
  {
    role: "admin",
    description:
      "System administrator who manages users, role permissions and platform-wide settings.",
  },
];
