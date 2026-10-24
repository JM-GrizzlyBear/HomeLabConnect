import { Email } from "../../domain/identity/email.js";
import { EmailAlreadyTaken } from "../../domain/identity/identityErrors.js";
import { assertPasswordIsStrong } from "../../domain/identity/passwordPolicy.js";
import type { PasswordHasher } from "../ports/passwordHasher.js";
import type { UserRepository } from "../ports/userRepository.js";
import { toUserOutput, type UserOutput } from "./userOutput.js";

export interface RegisterPatientInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string | null;
  address: string | null;
}

/** A patient signs themselves up. They sign in separately afterwards. */
export class RegisterPatient {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterPatientInput): Promise<UserOutput> {
    const email = Email.of(input.email);
    assertPasswordIsStrong(input.password);
    if (await this.users.findByEmail(email.value)) throw new EmailAlreadyTaken();

    const user = await this.users.createPatientAccount({
      email: email.value,
      passwordHash: await this.hasher.hash(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      birthDate: input.birthDate,
      address: input.address,
    });
    return toUserOutput(user);
  }
}
