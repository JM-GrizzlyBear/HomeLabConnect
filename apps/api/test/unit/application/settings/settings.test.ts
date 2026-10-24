import { describe, expect, it } from "vitest";
import { AddClosedDay } from "../../../src/application/use-cases/addClosedDay.js";
import { GetSystemSettings } from "../../../src/application/use-cases/getSystemSettings.js";
import { RemoveClosedDay } from "../../../src/application/use-cases/removeClosedDay.js";
import { UpdateClosedDay } from "../../../src/application/use-cases/updateClosedDay.js";
import { UpdateSystemSettings } from "../../../src/application/use-cases/updateSystemSettings.js";
import {
  ClosedDayExists,
  ClosedDayNotFound,
  InvalidClosedDay,
  InvalidSettings,
} from "../../../src/domain/settings/settingsErrors.js";
import { DEFAULT_SETTINGS } from "../../../src/domain/settings/systemSettings.js";
import {
  FixedClock,
  InMemoryClosedDayRepository,
  InMemorySettingsRepository,
  InMemoryUserRepository,
} from "../../support/fakes.js";

describe("system settings", () => {
  it("starts from the defaults and records who saved a change", async () => {
    const users = new InMemoryUserRepository();
    const admin = users.add({
      email: "admin@example.com",
      role: "admin",
      firstName: "Ana",
      lastName: "Cruz",
    });
    const settings = new InMemorySettingsRepository(users, new FixedClock());

    expect((await new GetSystemSettings(settings).execute()).settings).toEqual(DEFAULT_SETTINGS);

    const saved = await new UpdateSystemSettings(settings).execute({
      actorId: admin.id,
      settings: { ...DEFAULT_SETTINGS, visitDays: [6, 1, 1] },
    });
    expect(saved.settings.visitDays).toEqual([1, 6]);
    expect(saved.updatedBy).toBe("Ana Cruz");
  });

  it("refuses settings that break a rule and keeps the old ones", async () => {
    const settings = new InMemorySettingsRepository();

    await expect(
      new UpdateSystemSettings(settings).execute({
        actorId: "a",
        settings: { ...DEFAULT_SETTINGS, visitEnd: "05:00" },
      }),
    ).rejects.toThrow(InvalidSettings);
    expect((await settings.get()).updatedAt).toBeNull();
  });
});

describe("closed days", () => {
  const outing = {
    date: "2026-10-09",
    name: " Company outing ",
    kind: "special_day_off" as const,
    repeatsYearly: false,
  };

  it("adds, updates and removes a closed day", async () => {
    const closedDays = new InMemoryClosedDayRepository();

    const added = await new AddClosedDay(closedDays).execute({ ...outing, actorId: "a" });
    expect(added.name).toBe("Company outing");

    const moved = await new UpdateClosedDay(closedDays).execute({
      id: added.id,
      ...outing,
      date: "2026-10-16",
    });
    expect(moved.date).toBe("2026-10-16");

    await new RemoveClosedDay(closedDays).execute({ id: added.id });
    await expect(new RemoveClosedDay(closedDays).execute({ id: added.id })).rejects.toThrow(
      ClosedDayNotFound,
    );
  });

  it("refuses a blank name and a date that's already closed", async () => {
    const closedDays = new InMemoryClosedDayRepository();
    closedDays.add({ date: "2026-10-09", name: "Outing" });
    const add = new AddClosedDay(closedDays);

    await expect(add.execute({ ...outing, name: " ", actorId: "a" })).rejects.toThrow(
      InvalidClosedDay,
    );
    await expect(add.execute({ ...outing, actorId: "a" })).rejects.toThrow(ClosedDayExists);
  });
});
