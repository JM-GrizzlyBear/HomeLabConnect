export interface MedTeamShiftSeed {
  memberUserEmail: string;
  dayOfWeek: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  shiftStart: string; // "HH:MM:SS"
  shiftEnd: string; // "HH:MM:SS"
  isActive: boolean;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveUntil: string | null;
}

export const SEED_MED_TEAM_SHIFTS: MedTeamShiftSeed[] = [
  {
    memberUserEmail: "medteam@homelabconnect.local",
    dayOfWeek: "mon",
    shiftStart: "08:00:00",
    shiftEnd: "17:00:00",
    isActive: true,
    effectiveFrom: "2026-01-01",
    effectiveUntil: null,
  },
  {
    memberUserEmail: "medteam@homelabconnect.local",
    dayOfWeek: "tue",
    shiftStart: "08:00:00",
    shiftEnd: "17:00:00",
    isActive: true,
    effectiveFrom: "2026-01-01",
    effectiveUntil: null,
  },
  {
    memberUserEmail: "medteam@homelabconnect.local",
    dayOfWeek: "wed",
    shiftStart: "08:00:00",
    shiftEnd: "17:00:00",
    isActive: true,
    effectiveFrom: "2026-01-01",
    effectiveUntil: null,
  },
  {
    memberUserEmail: "medteam@homelabconnect.local",
    dayOfWeek: "thu",
    shiftStart: "08:00:00",
    shiftEnd: "17:00:00",
    isActive: true,
    effectiveFrom: "2026-01-01",
    effectiveUntil: null,
  },
  {
    memberUserEmail: "medteam@homelabconnect.local",
    dayOfWeek: "fri",
    shiftStart: "08:00:00",
    shiftEnd: "17:00:00",
    isActive: true,
    effectiveFrom: "2026-01-01",
    effectiveUntil: null,
  },
];
