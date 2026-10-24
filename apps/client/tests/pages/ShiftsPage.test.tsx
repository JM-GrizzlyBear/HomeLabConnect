import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, getISODay, parseISO } from "date-fns";
import { beforeEach, describe, expect, it } from "vitest";
import {
  datesFrom,
  datesOfMonth,
  mondayOf,
  monthEnd,
  monthOf,
  shiftDate,
} from "../../src/format/schedule";
import { adminUser, mockApi, renderApp, sampleUser, toasts } from "../support/renderApp";

const month = monthOf();
const monthDates = datesOfMonth(month);
const juan = {
  id: "3d4e5f60-7182-493a-acbd-2e3f4a5b6c7d",
  firstName: "Juan",
  lastName: "Dela Cruz",
  role: "med_team",
};

const day = (date: string, status: string, extra: Record<string, unknown> = {}) => ({
  date,
  status,
  start: null,
  end: null,
  label: null,
  ...extra,
});
const working = (date: string) => day(date, "working", { start: "08:00", end: "17:00" });
const longLabel = (date: string) => format(parseISO(date), "EEEE, MMMM d");

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("homelabconnect.token", "tkn");
});

describe("MySchedulePage", () => {
  it("shows the month with working days, a holiday and leave over a working day", async () => {
    const [first, second, third] = monthDates;
    const days = monthDates.map((date) =>
      date === first
        ? working(date)
        : date === second
          ? day(date, "leave", { start: "08:00", end: "17:00" })
          : date === third
            ? day(date, "closed", { label: "Company outing" })
            : day(date, "off"),
    );
    mockApi({
      "GET /api/auth/me": () => ({
        status: 200,
        body: { ...sampleUser, role: "med_team", permissions: ["shifts.view_own"] },
      }),
      [`GET /api/shifts/mine?from=${month}&to=${monthEnd(month)}`]: () => ({
        status: 200,
        body: days,
      }),
    });
    renderApp("/app/scheduling/mine");

    expect(
      await screen.findByLabelText(`${longLabel(first!)}: 8:00 AM – 5:00 PM`),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(`${longLabel(second!)}: On leave`)).toBeInTheDocument();
    expect(
      screen.getByLabelText(`${longLabel(third!)}: Company outing (closed)`),
    ).toBeInTheDocument();
    expect(screen.getByText("1 working day · 1 day on leave")).toBeInTheDocument();
  });
});

describe("ShiftsPage", () => {
  const weekStart = mondayOf();
  const board = () => ({
    status: 200,
    body: [{ person: juan, days: datesFrom(weekStart, 7).map(working) }],
  });
  const BOARD = `GET /api/shifts?from=${weekStart}&to=${shiftDate(weekStart, 6)}`;
  // The editor opens on the month of the clicked week or day.
  const editorMonthOf = (date: string) => monthOf(date);

  it("sets the same hours on every weekday of the month, skipping holidays", async () => {
    const editorMonth = editorMonthOf(weekStart);
    const editorDates = datesOfMonth(editorMonth);
    const firstWeekday = editorDates.find((date) => getISODay(parseISO(date)) <= 5)!;
    let sent: { dates: string[]; hours: unknown } | undefined;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [BOARD]: board,
      [`GET /api/shifts?from=${editorMonth}&to=${monthEnd(editorMonth)}&role=med_team`]: () => ({
        status: 200,
        body: [
          {
            person: juan,
            days: editorDates.map((date) =>
              date === firstWeekday ? day(date, "closed", { label: "Holiday" }) : day(date, "off"),
            ),
          },
        ],
      }),
      [`PUT /api/shifts/${juan.id}/days`]: (body) => {
        sent = body as typeof sent;
        return { status: 200, body: { changed: sent!.dates.length } };
      },
    });
    renderApp("/app/scheduling/shifts");

    await userEvent.click(await screen.findByRole("button", { name: "Juan Dela Cruz" }));
    const sheet = within(await screen.findByRole("dialog"));
    await userEvent.click(sheet.getByRole("combobox", { name: "From" }));
    await userEvent.click(await screen.findByRole("option", { name: "7:00 AM" }));
    await userEvent.click(await sheet.findByRole("button", { name: "Mon–Fri" }));
    await userEvent.click(sheet.getByRole("button", { name: "Set 7:00 AM – 5:00 PM" }));

    expect(await toasts().findByText("Shifts set")).toBeInTheDocument();
    const weekdays = editorDates.filter((date) => getISODay(parseISO(date)) <= 5);
    expect(sent!.hours).toEqual({ start: "07:00", end: "17:00" });
    expect(sent!.dates).toEqual(weekdays.filter((date) => date !== firstWeekday));
  });

  it("opens a clicked day already picked, and makes it a day off", async () => {
    const date = weekStart;
    const editorMonth = editorMonthOf(date);
    let sent: unknown;
    mockApi({
      "GET /api/auth/me": () => ({ status: 200, body: adminUser }),
      [BOARD]: board,
      [`GET /api/shifts?from=${editorMonth}&to=${monthEnd(editorMonth)}&role=med_team`]: () => ({
        status: 200,
        body: [{ person: juan, days: datesOfMonth(editorMonth).map(working) }],
      }),
      [`PUT /api/shifts/${juan.id}/days`]: (body) => {
        sent = body;
        return { status: 200, body: { changed: 1 } };
      },
    });
    renderApp("/app/scheduling/shifts");

    const cells = await screen.findAllByRole("button", { name: /^Juan Dela Cruz, / });
    await userEvent.click(cells[0]!);
    const sheet = within(await screen.findByRole("dialog"));
    expect(await sheet.findByText("1 day picked")).toBeInTheDocument();
    await userEvent.click(sheet.getByRole("button", { name: "Make days off" }));

    expect(await toasts().findByText("Days off set")).toBeInTheDocument();
    expect(sent).toEqual({ dates: [date], hours: null });
  });

  it("is read-only without shifts.manage", async () => {
    mockApi({
      "GET /api/auth/me": () => ({
        status: 200,
        body: { ...sampleUser, role: "support", permissions: ["shifts.view"] },
      }),
      [BOARD]: board,
    });
    renderApp("/app/scheduling/shifts");

    expect(await screen.findByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Juan Dela Cruz" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Juan Dela Cruz, / })).toHaveLength(0);
  });
});
