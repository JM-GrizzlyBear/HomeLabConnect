import type {
  Appointment,
  AppointmentEventKind,
  AppointmentLine,
  AppointmentStatus,
} from "./appointment.js";
import type { DayBookings } from "./availability.js";

export interface NewAppointment {
  patientId: string;
  date: string;
  slot: string;
  status: AppointmentStatus;
  address: string;
  landmark: string | null;
  notes: string | null;
  lines: AppointmentLine[];
}

/** The most a slot and its day may hold when a booking is saved. */
export interface SlotLimits {
  perSlot: number;
  perDay: number;
}

export interface AppointmentListQuery {
  status: AppointmentStatus | null;
  from: string | null;
  to: string | null;
  /** Matches the code or the patient's name. */
  q: string | null;
  page: number;
  pageSize: number;
}

export interface AppointmentListPage {
  items: Appointment[];
  total: number;
}

export interface StatusChange {
  status: AppointmentStatus;
  actorId: string;
  event: AppointmentEventKind;
  note: string | null;
  /** Saved as the reason shown to the patient (reject and staff cancel). */
  decisionNote?: string | null;
}

/** Port: appointments, their tests, history and reschedule proposals. */
export interface AppointmentRepository {
  /** Visits holding a place on each date in the range, per slot and in total. */
  bookingsBetween(from: string, to: string): Promise<Map<string, DayBookings>>;
  /**
   * Saves the booking only if its slot and day still have room, checked and written
   * atomically so two patients can't take the last place. Throws SlotFull otherwise.
   */
  book(appointment: NewAppointment, limits: SlotLimits, actorId: string): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  /** Newest visit date first. */
  listForPatient(patientId: string): Promise<Appointment[]>;
  list(query: AppointmentListQuery): Promise<AppointmentListPage>;
  changeStatus(id: string, change: StatusChange): Promise<void>;
  /** Opens a proposal and moves the appointment to reschedule_proposed. */
  proposeTime(
    id: string,
    proposal: { date: string; slot: string; reason: string },
    actorId: string,
  ): Promise<void>;
  /**
   * The patient accepts the open proposal: the appointment moves to its date and slot
   * (if they still have room) and is confirmed. Throws SlotFull otherwise.
   */
  acceptProposal(id: string, limits: SlotLimits, actorId: string): Promise<void>;
  /** The patient declines: the proposal closes and the appointment is cancelled. */
  declineProposal(id: string, actorId: string): Promise<void>;
}
