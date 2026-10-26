/**
 * Every cached query's key, by feature. The first part is the feature, so a change can
 * refresh everything about it at once (see `reload` in useApiQuery).
 */
export const queryKeys = {
  currentUser: ["auth", "me"] as const,
  profile: ["profile"] as const,
  users: (filters: unknown) => ["users", filters] as const,
  roles: ["roles"] as const,
  role: (id: string | undefined) => ["roles", id] as const,
  categories: ["categories"] as const,
  procedures: (filters: unknown) => ["procedures", filters] as const,
  procedure: (id: string | undefined) => ["procedures", "one", id] as const,
  promotions: (filters: unknown) => ["promotions", filters] as const,
  promotion: (id: string | undefined) => ["promotions", "one", id] as const,
  settings: ["settings"] as const,
  closedDays: (year: number) => ["closedDays", year] as const,
  teams: (date: string | null) => ["teams", date] as const,
  staff: (role: string) => ["staff", role] as const,
  shiftBoard: (from: string, to: string, role: string | null) =>
    ["shifts", from, to, role] as const,
  mySchedule: (from: string, to: string) => ["schedule", from, to] as const,
  myLeave: ["leave", "mine"] as const,
  leaveInbox: ["leave", "inbox"] as const,
  allLeave: (status: string | null) => ["leave", "all", status] as const,
  availability: (from: string, to: string) => ["appointments", "availability", from, to] as const,
  quote: (procedureIds: readonly string[]) => ["appointments", "quote", procedureIds] as const,
  myAppointments: ["appointments", "mine"] as const,
  appointment: (id: string | undefined) => ["appointments", "one", id] as const,
  allAppointments: (filters: unknown) => ["appointments", "all", filters] as const,
  teamChoices: (id: string) => ["appointments", "teams", id] as const,
  myVisits: (date: string) => ["appointments", "visits", date] as const,
  notes: (id: string) => ["appointments", "notes", id] as const,
  routeTeams: (date: string) => ["appointments", "route-teams", date] as const,
  route: (teamId: string, date: string) => ["appointments", "route", teamId, date] as const,
  appointmentPayments: (id: string) => ["payments", "appointment", id] as const,
  myPayments: ["payments", "mine"] as const,
  allPayments: (filters: unknown) => ["payments", "all", filters] as const,
};
