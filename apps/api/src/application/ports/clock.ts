/** Port: the current time, so use cases stay testable. */
export interface Clock {
  now(): Date;
}
