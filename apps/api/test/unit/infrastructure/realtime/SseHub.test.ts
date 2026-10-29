import { describe, expect, it } from "vitest";
import type { AppEvent } from "../../../../src/application/ports/EventPublisher.js";
import { SseHub } from "../../../../src/infrastructure/realtime/SseHub.js";

const event: AppEvent = {
  type: "ticket.message",
  ticketId: "9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d",
  subject: "Results",
  actorId: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  actorName: "Maria Santos",
};

function stream() {
  const chunks: string[] = [];
  return { chunks, write: (chunk: string) => chunks.push(chunk) };
}

describe("SseHub", () => {
  it("writes an event frame to every open stream of the users named, once each", () => {
    const hub = new SseHub();
    const [tab1, tab2, other] = [stream(), stream(), stream()];
    hub.connect("maria", tab1);
    hub.connect("maria", tab2);
    hub.connect("juan", other);

    hub.publish(["maria", "maria", "nobody"], event);

    const frame = `event: ticket.message\ndata: ${JSON.stringify(event)}\n\n`;
    expect(tab1.chunks).toEqual([frame]);
    expect(tab2.chunks).toEqual([frame]);
    expect(other.chunks).toEqual([]);
  });

  it("stops writing to a stream once it disconnects", () => {
    const hub = new SseHub();
    const tab = stream();
    const disconnect = hub.connect("maria", tab);
    expect(hub.connections).toBe(1);

    disconnect();
    hub.publish(["maria"], event);

    expect(tab.chunks).toEqual([]);
    expect(hub.connections).toBe(0);
  });

  it("keeps going when one stream fails to write", () => {
    const hub = new SseHub();
    const broken = {
      write: () => {
        throw new Error("closed");
      },
    };
    const tab = stream();
    hub.connect("maria", broken);
    hub.connect("maria", tab);

    hub.publish(["maria"], event);

    expect(tab.chunks).toHaveLength(1);
  });
});
