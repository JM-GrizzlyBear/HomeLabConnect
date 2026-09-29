/** Port: one-way password hashing. */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  /**
   * Checks a password against a stored hash. With a null hash it still does
   * the same work and returns false, so response time doesn't reveal whether
   * an email is registered.
   */
  verify(plain: string, hash: string | null): Promise<boolean>;
}
