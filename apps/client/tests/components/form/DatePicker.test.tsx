import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DatePickerField } from "../../../src/components/form/DatePicker";

function Harness({ onChange, initial = "" }: { onChange(value: string): void; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <DatePickerField
      label="Hired on"
      required={false}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("DatePickerField", () => {
  it("emits the picked day as an ISO date and shows it on the button", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial="2026-01-15" />);

    const trigger = screen.getByLabelText(/Hired on/);
    expect(trigger).toHaveTextContent("Jan 15, 2026");

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("button", { name: /January 20th, 2026/ }));

    expect(onChange).toHaveBeenCalledWith("2026-01-20");
    expect(trigger).toHaveTextContent("Jan 20, 2026");
  });

  it("can be cleared when optional", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial="2026-01-15" />);

    await userEvent.click(screen.getByLabelText(/Hired on/));
    await userEvent.click(await screen.findByRole("button", { name: "Clear date" }));

    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.getByLabelText(/Hired on/)).toHaveTextContent("Pick a date");
  });
});
