import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { Notice } from "../../domain/notifications/notification.js";
import type { NotificationRepository } from "../../domain/notifications/NotificationRepository.js";
import type { StaffDirectory } from "../../domain/scheduling/StaffDirectory.js";
import type { Clock } from "../ports/Clock.js";
import type { EventPublisher } from "../ports/EventPublisher.js";

/**
 * Puts a notice in people's bells and rings them live. Like an email, it's a courtesy: a
 * failure is logged and never undoes the change that caused it.
 */
export class Notifier {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly staff: StaffDirectory,
    private readonly events: EventPublisher,
    private readonly clock: Clock,
  ) {}

  /** Everyone in `userIds` (each once), except `exceptId` (who did it). */
  async toUsers(
    userIds: readonly (string | null | undefined)[],
    notice: Notice,
    exceptId: string | null = null,
  ): Promise<void> {
    const recipients = [
      ...new Set(userIds.filter((id): id is string => Boolean(id) && id !== exceptId)),
    ];
    if (recipients.length === 0) return;
    try {
      const saved = await this.notifications.add(recipients, notice, this.clock.now());
      for (const notification of saved) {
        this.events.publish([notification.userId], {
          type: "notification.new",
          id: notification.id,
          title: notification.title,
          body: notification.body,
          link: notification.link,
        });
      }
    } catch (error) {
      console.error(`Could not save the "${notice.kind}" notification:`, error);
    }
  }

  /** Every active staff member with one of these base roles. */
  async toRoles(
    roles: readonly BaseRole[],
    notice: Notice,
    exceptId: string | null = null,
  ): Promise<void> {
    try {
      const staff = await this.staff.listActive(null);
      const ids = staff.filter((member) => roles.includes(member.role)).map((member) => member.id);
      await this.toUsers(ids, notice, exceptId);
    } catch (error) {
      console.error(`Could not find who gets the "${notice.kind}" notification:`, error);
    }
  }
}
