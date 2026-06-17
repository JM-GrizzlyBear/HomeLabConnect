import jwt, { type SignOptions } from "jsonwebtoken";
import type {
  TokenPayload,
  TokenService,
} from "../../application/ports/token-service";

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(payload: TokenPayload): string {
    const opts: SignOptions = {
      expiresIn: this.expiresIn as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, this.secret, opts);
  }

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret);
    if (typeof decoded !== "object" || decoded === null) {
      throw new Error("Invalid token payload");
    }
    return decoded as TokenPayload;
  }
}
