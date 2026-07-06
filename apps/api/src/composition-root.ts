import { CreatePatientProfileUseCase } from "./application/use-cases/create-patient-profile";
import { CreateRoleUseCase } from "./application/use-cases/create-role";
import { GetMeUseCase } from "./application/use-cases/get-me";
import { ListRolesUseCase } from "./application/use-cases/list-roles";
import { LoginUserUseCase } from "./application/use-cases/login-user";
import { RegisterUserUseCase } from "./application/use-cases/register-user";
import { UpdatePatientProfileUseCase } from "./application/use-cases/update-patient-profile";
import { UpdateRoleUseCase } from "./application/use-cases/update-role";
import { env } from "./env";
import { db } from "./infrastructure/db/client";
import { DrizzlePatientRepository } from "./infrastructure/db/repositories/drizzle-patient-repository";
import { DrizzleRoleRepository } from "./infrastructure/db/repositories/drizzle-role-repository";
import { DrizzleUserRepository } from "./infrastructure/db/repositories/drizzle-user-repository";
import { BcryptPasswordHasher } from "./infrastructure/security/bcrypt-password-hasher";
import { JwtTokenService } from "./infrastructure/security/jwt-token-service";
import type { UseCases } from "./interface/orpc/context";

const userRepo = new DrizzleUserRepository(db);
const roleRepo = new DrizzleRoleRepository(db);
const patientRepo = new DrizzlePatientRepository(db);

const hasher = new BcryptPasswordHasher(10);
export const tokens = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);

export const usecases: UseCases = {
  registerUser: new RegisterUserUseCase(userRepo, hasher, tokens),
  loginUser: new LoginUserUseCase(userRepo, hasher, tokens),
  getMe: new GetMeUseCase(userRepo),
  listRoles: new ListRolesUseCase(roleRepo),
  createRole: new CreateRoleUseCase(roleRepo),
  updateRole: new UpdateRoleUseCase(roleRepo),
  createPatientProfile: new CreatePatientProfileUseCase(patientRepo),
  updatePatientProfile: new UpdatePatientProfileUseCase(patientRepo),
};
