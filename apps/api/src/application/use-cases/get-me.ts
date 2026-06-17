import type { PublicUser } from "@homelabconnect/shared";
import { toPublicUser } from "../../domain/entities/user";
import { NotFoundError } from "../../domain/error";
import type { UserRepository } from "../ports/user-repository";

export class GetMeUseCase {
  constructor(private readonly users: UserRepository) {}

  async exec(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User");
    return toPublicUser(user);
  }
}
