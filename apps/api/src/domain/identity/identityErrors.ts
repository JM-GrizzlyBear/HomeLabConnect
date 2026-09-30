import { DomainError } from "../errors/domainError.js";

export class InvalidEmail extends DomainError {
  readonly kind = "validation";
  constructor() {
    super("Email address is not valid.", "invalid_email");
  }
}

export class WeakPassword extends DomainError {
  readonly kind = "validation";
  constructor(reason: string) {
    super(reason, "weak_password");
  }
}

/** Wrong email or password. Deliberately does not say which. */
export class InvalidCredentials extends DomainError {
  readonly kind = "unauthorized";
  constructor() {
    super("Email or password is incorrect.", "invalid_credentials");
  }
}

/** No token, a bad token, or a session that has expired or been revoked. */
export class Unauthenticated extends DomainError {
  readonly kind = "unauthorized";
  constructor() {
    super("You need to sign in.", "unauthenticated");
  }
}

export class AccountDeactivated extends DomainError {
  readonly kind = "forbidden";
  constructor() {
    super("This account has been deactivated.", "account_deactivated");
  }
}

export class PasswordChangeRequired extends DomainError {
  readonly kind = "forbidden";
  constructor() {
    super("You must change your temporary password first.", "password_change_required");
  }
}

export class RoleNotAllowed extends DomainError {
  readonly kind = "forbidden";
  constructor() {
    super("You do not have access to this resource.", "forbidden");
  }
}

export class EmailAlreadyTaken extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super("An account with this email already exists.", "email_taken");
  }
}

export class UserNotFound extends DomainError {
  readonly kind = "not_found";
  constructor() {
    super("User not found.", "user_not_found");
  }
}

/** Changing a password needs the current one. Not "unauthorized": the session itself is fine. */
export class IncorrectCurrentPassword extends DomainError {
  readonly kind = "validation";
  constructor() {
    super("Current password is incorrect.", "incorrect_current_password");
  }
}

export class PasswordUnchanged extends DomainError {
  readonly kind = "validation";
  constructor() {
    super("New password must be different from the current one.", "password_unchanged");
  }
}

export class PhoneRequired extends DomainError {
  readonly kind = "validation";
  constructor() {
    super("Patients need a mobile number so the med team can reach them.", "phone_required");
  }
}

export class PatientDetailsNotAllowed extends DomainError {
  readonly kind = "validation";
  constructor() {
    super("Only patients have a birth date and home address.", "patient_details_not_allowed");
  }
}
