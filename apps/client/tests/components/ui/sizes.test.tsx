import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "../../../src/components/ui/select";

// One scale for every control, so a sm button lines up with a sm input and select.
const heights = { sm: "h-8", md: "h-10", lg: "h-12" } as const;
const sizes = Object.keys(heights) as (keyof typeof heights)[];

describe("control size scale", () => {
  it.each(sizes)("Button, Input and Select share the %s height", (size) => {
    render(
      <>
        <Button size={size}>Save</Button>
        <Input size={size} aria-label="Name" />
        <Select>
          <SelectTrigger size={size} aria-label="Role">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
        </Select>
      </>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(heights[size]);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveClass(heights[size]);
    expect(screen.getByRole("combobox", { name: "Role" })).toHaveClass(heights[size]);
  });

  it("defaults to md", () => {
    render(
      <>
        <Button>Save</Button>
        <Input aria-label="Name" />
      </>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("h-10");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveClass("h-10");
  });

  it("disables a loading button and marks it busy", () => {
    render(<Button loading>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
