/** Port: random temporary passwords that satisfy the password policy. */
export interface TemporaryPasswordGenerator {
  generate(): string;
}
