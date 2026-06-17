import type { Role } from "@homelabconnect/shared";

export interface TokenPayload {
  sub: string; // user id
  role: Role;
}

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
