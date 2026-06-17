import type { Role } from "@homelabconnect/shared";
import type { CreateRoleUseCase } from "../../application/use-cases/create-role";
import type { GetMeUseCase } from "../../application/use-cases/get-me";
import type { ListRolesUseCase } from "../../application/use-cases/list-roles";
import type { LoginUserUseCase } from "../../application/use-cases/login-user";
import type { RegisterUserUseCase } from "../../application/use-cases/register-user";
import type { UpdateRoleUseCase } from "../../application/use-cases/update-role";
import type { TokenService } from "../../application/ports/token-service";

export interface AuthedUser {
  id: string;
  role: Role;
}

export interface UseCases {
  registerUser: RegisterUserUseCase;
  loginUser: LoginUserUseCase;
  getMe: GetMeUseCase;
  listRoles: ListRolesUseCase;
  createRole: CreateRoleUseCase;
  updateRole: UpdateRoleUseCase;
}

export interface Context {
  user: AuthedUser | null;
  authHeader: string | undefined;
  tokens: TokenService;
  usecases: UseCases;
}
