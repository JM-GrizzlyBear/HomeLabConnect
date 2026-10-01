import type { ClosedDay, SettingsResponse } from "@homelabconnect/shared";
import type { SettingsRecord } from "../../../application/ports/settingsRepository.js";
import type { ClosedDay as DomainClosedDay } from "../../../domain/settings/closedDay.js";
import type { HttpResponse } from "../httpTypes.js";

export function presentSettings(record: SettingsRecord): HttpResponse<SettingsResponse> {
  return {
    status: 200,
    body: {
      settings: {
        ...record.settings,
        slotMinutes: record.settings.slotMinutes as SettingsResponse["settings"]["slotMinutes"],
      },
      updatedAt: record.updatedAt?.toISOString() ?? null,
      updatedBy: record.updatedBy,
    },
  };
}

function toClosedDay(closedDay: DomainClosedDay): ClosedDay {
  return {
    id: closedDay.id,
    date: closedDay.date,
    name: closedDay.name,
    kind: closedDay.kind,
    repeatsYearly: closedDay.repeatsYearly,
  };
}

export function presentClosedDay(
  closedDay: DomainClosedDay,
  status = 200,
): HttpResponse<ClosedDay> {
  return { status, body: toClosedDay(closedDay) };
}

export function presentClosedDayList(closedDays: DomainClosedDay[]): HttpResponse<ClosedDay[]> {
  return { status: 200, body: closedDays.map(toClosedDay) };
}
