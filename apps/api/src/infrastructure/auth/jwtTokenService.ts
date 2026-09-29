import jwt from "jsonwebtoken";
import type { AccessTokenClaims, TokenService } from "../../application/ports/tokenService.js";

const ALGORITHM = "HS256";
const ISSUER = "homelabconnect";

/** HS256 JWTs: `sub` is the user id, `sid` the session id. */
export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {}

  issue(claims: AccessTokenClaims, expiresAt: Date): string {
    return jwt.sign(
      { sid: claims.sessionId, exp: Math.floor(expiresAt.getTime() / 1000) },
      this.secret,
      {
        algorithm: ALGORITHM,
        issuer: ISSUER,
        subject: claims.userId,
      },
    );
  }

  verify(token: string): AccessTokenClaims | null {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: [ALGORITHM], issuer: ISSUER });
      if (typeof payload === "string" || typeof payload.sub !== "string") return null;
      if (typeof payload.sid !== "string") return null;
      return { userId: payload.sub, sessionId: payload.sid };
    } catch {
      return null;
    }
  }
}
