import type { AppEvent, EventPublisher } from "../../application/ports/EventPublisher.js";

/** An open event stream: anything that can take more text (an Express response). */
export interface SseClient {
  write(chunk: string): unknown;
}

/**
 * Keeps every signed-in browser's open /api/events stream, by user, and writes events to them
 * as Server-Sent Events. In memory: fine for one API instance. With several, each would need
 * the events too (e.g. through Postgres LISTEN/NOTIFY).
 */
export class SseHub implements EventPublisher {
  private readonly clients = new Map<string, Set<SseClient>>();

  /** Starts sending this user's events to `client`; call the result when it goes away. */
  connect(userId: string, client: SseClient): () => void {
    const clients = this.clients.get(userId) ?? new Set<SseClient>();
    clients.add(client);
    this.clients.set(userId, clients);
    return () => {
      clients.delete(client);
      if (clients.size === 0) this.clients.delete(userId);
    };
  }

  /** How many streams are open (all users). */
  get connections(): number {
    let total = 0;
    for (const clients of this.clients.values()) total += clients.size;
    return total;
  }

  publish(userIds: readonly string[], event: AppEvent): void {
    const frame = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const userId of new Set(userIds)) {
      for (const client of this.clients.get(userId) ?? []) {
        try {
          client.write(frame);
        } catch {
          // A stream that just closed; its own close handler removes it
        }
      }
    }
  }
}
