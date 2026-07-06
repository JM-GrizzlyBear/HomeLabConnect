export interface MedTeamMemberSeed {
  userEmail: string;
  licenseNumber: string | null;
  specialization: string | null;
  serviceAreaCity: string | null;
  isAvailable: boolean;
  rating: number | null;
}

export const SEED_MED_TEAM_MEMBERS: MedTeamMemberSeed[] = [
  {
    userEmail: "medteam@homelabconnect.local",
    licenseNumber: "MT-2026-001",
    specialization: "Phlebotomy",
    serviceAreaCity: "Makati",
    isAvailable: true,
    rating: 0,
  },
  {
    userEmail: "medteam2@homelabconnect.local",
    licenseNumber: "MT-2026-002",
    specialization: "Cardiology",
    serviceAreaCity: "Makati",
    isAvailable: true,
    rating: 0,
  },
  {
    userEmail: "medteam3@homelabconnect.local",
    licenseNumber: "MT-2026-003",
    specialization: "Neurology",
    serviceAreaCity: "Makati",
    isAvailable: true,
    rating: 0,
  },
  {
    userEmail: "medteam4@homelabconnect.local",
    licenseNumber: "MT-2026-004",
    specialization: "Anesthesiology",
    serviceAreaCity: "Makati",
    isAvailable: true,
    rating: 0,
  },
  {
    userEmail: "medteam5@homelabconnect.local",
    licenseNumber: "MT-2026-005",
    specialization: "Dermatology",
    serviceAreaCity: "Makati",
    isAvailable: false,
    rating: 0,
  },
];
