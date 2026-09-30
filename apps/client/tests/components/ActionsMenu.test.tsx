import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionsMenu } from "../../src/components/ActionsMenu";

describe("ActionsMenu", () => {
  it("opens the menu, leaves out hidden items and runs the chosen one", async () => {
    const edit = vi.fn();
    const remove = vi.fn();
    render(
      <ActionsMenu
        label="Actions for Ana"
        items={[
          { label: "Edit", onSelect: edit },
          { label: "Archive", onSelect: vi.fn(), hidden: true },
          { label: "Delete", onSelect: remove, destructive: true },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Actions for Ana" }));

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Edit",
      "Delete",
    ]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(remove).toHaveBeenCalledOnce();
    expect(edit).not.toHaveBeenCalled();
  });

  it("renders nothing when every item is hidden", () => {
    const { container } = render(
      <ActionsMenu label="Actions" items={[{ label: "Edit", onSelect: vi.fn(), hidden: true }]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
