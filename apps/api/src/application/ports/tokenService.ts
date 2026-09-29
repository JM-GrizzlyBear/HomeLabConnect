export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
}

/** Port: issues and checks the signed access tokens clients send with each request. */
export interface TokenService {
  issue(claims: AccessTokenClaims, expiresAt: Date): string;
  /** Returns null for a token that is malformed, tampered with or expired. */
  verify(token: string): AccessTokenClaims | null;
}
