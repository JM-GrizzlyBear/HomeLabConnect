export const SEED_DOCTORS = [
  {
    userEmail: "doctor@homelabconnect.local",
    licenseNumber: "MD-2026-001",
    specialization: "Family Medicine",
    clinicName: "HomeLab Connect Clinic",
    clinicAddress: "Makati Medical District",
  },
] as const;

export const SEED_SUPPORT_AGENTS = [
  { userEmail: "support@homelabconnect.local", isOnline: true },
] as const;

export const SEED_ADMINS = [
  {
    userEmail: "admin@homelabconnect.local",
    permissions: ["manage_users", "view_reports"],
  },
] as const;

export const SEED_SUPPORT_SHIFTS = [
  {
    agentEmail: "support@homelabconnect.local",
    dayOfWeek: "mon" as const,
    shiftStart: "08:00:00",
    shiftEnd: "17:00:00",
    effectiveFrom: "2026-01-01",
  },
] as const;

export const SEED_MED_TEAM_OVERRIDES = [
  {
    memberEmail: "medteam@homelabconnect.local",
    overrideDate: "2026-12-25",
    overrideType: "day_off" as const,
    shiftStart: null,
    shiftEnd: null,
    reason: "Holiday closure",
  },
] as const;

export const SEED_SUPPORT_OVERRIDES = [
  {
    agentEmail: "support@homelabconnect.local",
    overrideDate: "2026-12-24",
    overrideType: "custom_hours" as const,
    shiftStart: "08:00:00",
    shiftEnd: "12:00:00",
    reason: "Holiday reduced hours",
  },
] as const;

export const SEED_LAB_PROCEDURES = [
  {
    code: "CBC",
    name: "Complete Blood Count",
    category: "blood_test" as const,
    description: "Basic blood cell count screening.",
    preparationInstructions: "No fasting required unless otherwise instructed.",
    estimatedDurationMinutes: 30,
    price: 85000,
  },
  {
    code: "URINALYSIS",
    name: "Urinalysis",
    category: "urine_test" as const,
    description: "Routine urine screening.",
    preparationInstructions: "Provide a clean midstream sample.",
    estimatedDurationMinutes: 20,
    price: 50000,
  },
  {
    code: "CHEST-XRAY",
    name: "Chest X-ray",
    category: "xray" as const,
    description: "Portable chest radiograph performed at home.",
    preparationInstructions:
      "Wear comfortable clothing without metal accessories.",
    estimatedDurationMinutes: 45,
    price: 150000,
  },
] as const;

export const SEED_APPOINTMENTS = [
  {
    patientEmail: "patient01@homelabconnect.local",
    doctorEmail: "doctor@homelabconnect.local",
    requestedDate: "2026-10-15T09:00:00.000Z",
    confirmedDate: "2026-10-15T09:00:00.000Z",
    status: "accepted" as const,
    serviceAddress: "101 Sample Street, Makati",
    patientNotes: "Please call before arrival.",
    medteamNotes: "Bring standard blood collection kit.",
    procedureCodes: ["CBC", "URINALYSIS"],
  },
] as const;

export const SEED_RESCHEDULE_PROPOSALS = [
  {
    patientEmail: "patient01@homelabconnect.local",
    proposedByEmail: "medteam@homelabconnect.local",
    proposedDate: "2026-10-16T09:00:00.000Z",
    reason: "Original slot became unavailable.",
    status: "superseded" as const,
  },
] as const;

export const SEED_CHAT_CONVERSATIONS = [
  {
    type: "patient_support" as const,
    subject: "Preparation question",
    patientEmail: "patient01@homelabconnect.local",
    participantEmails: ["support@homelabconnect.local"],
  },
] as const;

export const SEED_PERMISSIONS = [
  {
    key: "appointment.create",
    label: "Create appointments",
    category: "appointment" as const,
  },
  {
    key: "appointment.manage",
    label: "Manage appointments",
    category: "appointment" as const,
  },
  {
    key: "chat.message.send",
    label: "Send chat messages",
    category: "chat" as const,
  },
  {
    key: "chat.attachment.create",
    label: "Send chat attachments",
    category: "chat" as const,
  },
  {
    key: "dashboard.view",
    label: "View dashboards",
    category: "dashboard" as const,
  },
  {
    key: "admin.users.manage",
    label: "Manage users",
    category: "admin" as const,
  },
] as const;

export const SEED_ROLE_PERMISSIONS = [
  {
    role: "patient" as const,
    permissionKey: "appointment.create",
    isGranted: true,
  },
  {
    role: "patient" as const,
    permissionKey: "chat.message.send",
    isGranted: true,
  },
  {
    role: "patient" as const,
    permissionKey: "chat.attachment.create",
    isGranted: true,
  },
  {
    role: "med_team" as const,
    permissionKey: "appointment.manage",
    isGranted: true,
  },
  {
    role: "med_team" as const,
    permissionKey: "chat.message.send",
    isGranted: true,
  },
  { role: "doctor" as const, permissionKey: "dashboard.view", isGranted: true },
  {
    role: "doctor" as const,
    permissionKey: "chat.message.send",
    isGranted: true,
  },
  {
    role: "support" as const,
    permissionKey: "chat.message.send",
    isGranted: true,
  },
  {
    role: "admin" as const,
    permissionKey: "admin.users.manage",
    isGranted: true,
  },
  { role: "admin" as const, permissionKey: "dashboard.view", isGranted: true },
] as const;
