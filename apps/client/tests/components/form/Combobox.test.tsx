import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { ComboboxField } from "../../../src/components/form/Combobox";

const procedures = [
  { value: "cbc", label: "Complete Blood Count" },
  { value: "fbs", label: "Fasting Blood Sugar" },
  { value: "ua", label: "Urinalysis" },
];

function Harness() {
  const [value, setValue] = useState("");
  return (
    <ComboboxField
      label="Procedure"
      options={procedures}
      value={value}
      onChange={setValue}
      placeholder="Choose a procedure"
    />
  );
}

describe("ComboboxField", () => {
  it("filters the options by typing and picks one", async () => {
    render(<Harness />);

    const trigger = screen.getByRole("combobox", { name: "Procedure" });
    expect(trigger).toHaveTextContent("Choose a procedure");

    await userEvent.click(trigger);
    await userEvent.type(await screen.findByPlaceholderText("Search…"), "blood");

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Complete Blood Count",
      "Fasting Blood Sugar",
    ]);
    await userEvent.click(screen.getByRole("option", { name: "Fasting Blood Sugar" }));

    expect(trigger).toHaveTextContent("Fasting Blood Sugar");
  });
});
