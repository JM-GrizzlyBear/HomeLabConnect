import { DomainError } from "../errors/domainError.js";

export class AppointmentNotFound extends DomainError {
  readonly kind = "not_found";

  constructor() {
    super("Appointment not found.", "appointment_not_found");
  }
}

/** The chosen date or time can't be booked (closed, outside the hours, too soon, too far). */
export class SlotNotBookable extends DomainError {
  readonly kind = "validation";

  constructor(message: string) {
    super(message, "slot_not_bookable");
  }
}

/** Every team on duty already has a visit at that time, or the day is full. */
export class SlotFull extends DomainError {
  readonly kind = "conflict";

  constructor() {
    super("That time was just taken. Please pick another.", "slot_full");
  }
}

export class InvalidBooking extends DomainError {
  readonly kind = "validation";

  constructor(message: string) {
    super(message, "invalid_booking");
  }
}

/** The appointment's status doesn't allow this (e.g. accepting a cancelled one). */
export class AppointmentStatusConflict extends DomainError {
  readonly kind = "conflict";

  constructor(message: string) {
    super(message, "appointment_status");
  }
}

export class CancelCutoffPassed extends DomainError {
  readonly kind = "validation";

  constructor(hours: number) {
    super(
      `Appointments can be cancelled up to ${hours} hours before the visit. Please contact support.`,
      "cancel_cutoff_passed",
    );
  }
}

/** The team isn't on duty that day, already has a visit at that time, or is full for the day. */
export class TeamUnavailable extends DomainError {
  readonly kind = "conflict";

  constructor(message = "That team can't take this visit.") {
    super(message, "team_unavailable");
  }
}

export class InvalidVisitRecord extends DomainError {
  readonly kind = "validation";

  constructor(message: string) {
    super(message, "invalid_visit_record");
  }
}
