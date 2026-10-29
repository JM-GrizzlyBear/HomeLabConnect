import { describe, expect, it, vi } from "vitest";
import { Notifier } from "../../../../src/application/notifications/Notifier.js";
import { NotifyingAppointmentEmails } from "../../../../src/application/notifications/NotifyingAppointmentEmails.js";
import type { AppEvent } from "../../../../src/application/ports/EventPublisher.js";
import type { Appointment } from "../../../../src/domain/appointments/appointment.js";
import {
  type Notice,
  type Notification,
  visitNotice,
  visitWhen,
} from "../../../../src/domain/notifications/notification.js";
import type { NotificationRepository } from "../../../../src/domain/notifications/NotificationRepository.js";
import type { StaffMember } from "../../../../src/domain/scheduling/StaffDirectory.js";
import { FixedClock } from "../../../support/fakes.js";

const visit = { id: "v1", code: "HLC-000042", date: "2026-01-17", slot: "08:00" };

function fakes({ failing = false } = {}) {
  const saved: Notification[] = [];
  const published: { userIds: readonly string[]; event: AppEvent }[] = [];
  const repository = {
    add: async (userIds: readonly string[], notice: Notice, at: Date) => {
      if (failing) throw new Error("database down");
      const rows = userIds.map((userId, i) => ({
        ...notice,
        id: `n${saved.length + i}`,
        userId,
        readAt: null,
        createdAt: at,
      }));
      saved.push(...rows);
      return rows;
    },
  } as unknown as NotificationRepository;
  const staff: StaffMember[] = [
    { id: "s1", firstName: "Ana", lastName: "Reyes", role: "support" },
    { id: "a1", firstName: "Sys", lastName: "Admin", role: "admin" },
    { id: "d1", firstName: "Doc", lastName: "Tor", role: "doctor" },
  ];
  const notifier = new Notifier(
    repository,
    { listActive: async () => staff },
    { publish: (userIds, event) => published.push({ userIds, event }) },
    new FixedClock(),
  );
  return { notifier, saved, published };
}

describe("notice wording", () => {
  it("names the visit and when it is, in Philippine time", () => {
    expect(visitWhen("2026-01-17", "14:30")).toBe("Sat, Jan 17 at 2:30 PM");
    expect(visitNotice("confirmed", visit)).toEqual({
      kind: "confirmed",
      title: "Visit HLC-000042 confirmed",
      body: "Our team will see you on Sat, Jan 17 at 8:00 AM.",
      link: "/app/appointments/v1",
    });
  });
});

describe("Notifier", () => {
  it("saves one per person (once each, never the actor) and rings each of them", async () => {
    const { notifier, saved, published } = fakes();
    await notifier.toUsers(["u1", "u2", "u1", null, "me"], visitNotice("confirmed", visit), "me");

    expect(saved.map((row) => row.userId)).toEqual(["u1", "u2"]);
    expect(published).toEqual([
      expect.objectContaining({ userIds: ["u1"] }),
      expect.objectContaining({ userIds: ["u2"] }),
    ]);
    expect(published[0]!.event).toMatchObject({
      type: "notification.new",
      title: "Visit HLC-000042 confirmed",
    });
  });

  it("finds staff by role, and does nothing for nobody", async () => {
    const { notifier, saved } = fakes();
    await notifier.toRoles(["support", "admin"], visitNotice("booking_pending", visit));
    expect(saved.map((row) => row.userId)).toEqual(["s1", "a1"]);

    await notifier.toUsers([], visitNotice("confirmed", visit));
    expect(saved).toHaveLength(2);
  });

  it("never fails the change that caused it", async () => {
    const { notifier, published } = fakes({ failing: true });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      notifier.toUsers(["u1"], visitNotice("confirmed", visit)),
    ).resolves.toBeUndefined();
    expect(published).toEqual([]);
    error.mockRestore();
  });
});

describe("NotifyingAppointmentEmails", () => {
  const appointment = { ...visit, patientId: "p1" } as unknown as Appointment;

  it("emails the patient and puts the same news in their bell", async () => {
    const { notifier, saved } = fakes();
    const sent: string[] = [];
    const emails = new NotifyingAppointmentEmails(
      { send: async (notice) => void sent.push(notice) },
      notifier,
    );

    await emails.send("results_ready", appointment);

    expect(sent).toEqual(["results_ready"]);
    expect(saved[0]).toMatchObject({
      userId: "p1",
      kind: "results_ready",
      link: "/app/results/mine",
    });
  });

  it("still notifies when the email fails", async () => {
    const { notifier, saved } = fakes();
    const emails = new NotifyingAppointmentEmails(
      {
        send: async () => {
          throw new Error("SMTP down");
        },
      },
      notifier,
    );

    await expect(emails.send("confirmed", appointment)).rejects.toThrow("SMTP down");
    expect(saved).toHaveLength(1);
  });
});
