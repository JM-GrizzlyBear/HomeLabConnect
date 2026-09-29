/** Port: lets a use case ask whether the database answers, without knowing which database it is. */
export interface DatabaseHealthProbe {
  isReachable(): Promise<boolean>;
}
