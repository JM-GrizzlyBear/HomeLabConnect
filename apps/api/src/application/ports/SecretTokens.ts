/** Port: long random tokens for links sent by email (e.g. a password reset). */
export interface SecretTokens {
  generate(): string;
}
