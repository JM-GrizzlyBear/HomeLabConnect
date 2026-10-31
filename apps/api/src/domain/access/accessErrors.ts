import { DomainError } from "../errors/domainError.js";

/** The signed-in user lacks the permission a route needs. */
export class PermissionDenied extends DomainError {
  readonly kind = "forbidden";
  constructor() {
    super("You do not have access to this resource.", "forbidden");
  }
}

export class CustomRoleNotFound extends DomainError {
  readonly kind = "not_found";
  constructor() {
    super("Role not found.", "role_not_found");
  }
}

export class CustomRoleNameTaken extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super("A role with this name already exists.", "role_name_taken");
  }
}

export class CustomRoleInUse extends DomainError {
  readonly kind = "conflict";
  constructor(userCount: number) {
    super(
      `This role is assigned to ${userCount} ${userCount === 1 ? "user" : "users"}. Move them to another role first.`,
      "role_in_use",
    );
  }
}

export class CustomRoleMismatch extends DomainError {
  readonly kind = "validation";
  constructor() {
    super("This custom role is built on a different base role than the user's.", "role_mismatch");
  }
}

export class CannotChangeOwnRole extends DomainError {
  readonly kind = "validation";
  constructor() {
    super("You can't change your own role.", "cannot_change_own_role");
  }
}

/** Admins can't override their own permissions (they could lock themselves out). */
export class CannotOverrideOwnPermissions extends DomainError {
  readonly kind = "validation";
  constructor() {
    super("You can't change your own permissions.", "cannot_override_own_permissions");
  }
}

/** An override that can't apply: an admin target, an unknown permission or a past end date. */
export class InvalidOverride extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_override");
  }
}
