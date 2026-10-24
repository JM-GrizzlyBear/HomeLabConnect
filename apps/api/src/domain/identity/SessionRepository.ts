/** Port: the browsers a user is signed in on, so an account can be signed out everywhere at once. */
export interface SessionRepository {
  /** Signs out every browser of a user, except the session `exceptSessionId` if given. */
  revokeAllForUser(userId: string, exceptSessionId?: string): Promise<void>;
}
