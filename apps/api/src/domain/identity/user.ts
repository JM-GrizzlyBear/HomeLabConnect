import type { BaseRole } from "./baseRole.js";
import { AccountDeactivated } from "./identityErrors.js";

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: BaseRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  mustChangePassword: boolean;
  isActive: boolean;
}

/** Anyone who can sign in: patients and staff alike. */
export class User {
  private constructor(private readonly props: UserProps) {}

  static restore(props: UserProps): User {
    return new User(props);
  }

  get id() {
    return this.props.id;
  }
  get email() {
    return this.props.email;
  }
  get passwordHash() {
    return this.props.passwordHash;
  }
  get role() {
    return this.props.role;
  }
  get firstName() {
    return this.props.firstName;
  }
  get lastName() {
    return this.props.lastName;
  }
  get phone() {
    return this.props.phone;
  }
  get mustChangePassword() {
    return this.props.mustChangePassword;
  }
  get isActive() {
    return this.props.isActive;
  }

  /** Business rule: deactivated accounts can't sign in or keep using a session. */
  assertCanSignIn(): void {
    if (!this.props.isActive) throw new AccountDeactivated();
  }
}
