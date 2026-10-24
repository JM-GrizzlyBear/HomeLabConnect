import { DomainError } from "../errors/domainError.js";

export class TeamNotFound extends DomainError {
  readonly kind = "not_found";
  constructor() {
    super("Team not found.", "team_not_found");
  }
}

export class TeamNameTaken extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super("A team with this name already exists.", "team_name_taken");
  }
}

export class InvalidTeam extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_team");
  }
}

export class InvalidRoster extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_roster");
  }
}

/** Someone is already on another team in the same two-week period. */
export class RosterClash extends DomainError {
  readonly kind = "conflict";
  constructor(person: string, team: string) {
    super(`${person} is already on ${team} for these two weeks.`, "roster_clash");
  }
}

export class InvalidShift extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_shift");
  }
}

export class StaffNotFound extends DomainError {
  readonly kind = "not_found";
  constructor() {
    super("Staff member not found.", "staff_not_found");
  }
}

export class InvalidDateRange extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_date_range");
  }
}

export class LeaveNotFound extends DomainError {
  readonly kind = "not_found";
  constructor() {
    super("Leave request not found.", "leave_not_found");
  }
}

export class InvalidLeave extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_leave");
  }
}

export class LeaveOverlap extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super("You already have leave on some of these days.", "leave_overlap");
  }
}

/** The request isn't at a step this person may decide. */
export class NotYourLeaveStep extends DomainError {
  readonly kind = "forbidden";
  constructor() {
    super("This request is waiting for someone else.", "not_your_leave_step");
  }
}

export class LeaveNotPending extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super("This request has already been decided.", "leave_not_pending");
  }
}

export class LeaveNotCancellable extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super(
      "Only pending leave, or approved leave that hasn't started, can be cancelled.",
      "leave_not_cancellable",
    );
  }
}

export class RosterPeriodNotEmpty extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super(
      "This period already has rosters. Edit them instead of copying.",
      "roster_period_not_empty",
    );
  }
}
