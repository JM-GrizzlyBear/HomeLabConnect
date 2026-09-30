import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useFeedback } from "../../src/feedback/feedbackContext";
import { FeedbackProvider } from "../../src/feedback/FeedbackProvider";

function Demo({ onAnswer }: { onAnswer?(confirmed: boolean): void }) {
  const feedback = useFeedback();
  return (
    <>
      <button onClick={() => feedback.success({ title: "Saved", description: "All good." })}>
        succeed
      </button>
      <button onClick={() => feedback.error({ title: "Failed", description: "Server down." })}>
        fail
      </button>
      <button
        onClick={() =>
          void feedback
            .confirm({ title: "Delete it?", confirmLabel: "Delete", destructive: true })
            .then(onAnswer)
        }
      >
        ask
      </button>
    </>
  );
}

function renderDemo(onAnswer?: (confirmed: boolean) => void) {
  render(
    <FeedbackProvider>
      <Demo onAnswer={onAnswer} />
    </FeedbackProvider>,
  );
}

describe("FeedbackProvider", () => {
  it("shows a success dialog that closes with OK", async () => {
    renderDemo();

    await userEvent.click(screen.getByRole("button", { name: "succeed" }));
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("Saved")).toBeInTheDocument();
    expect(dialog.getByText("All good.")).toBeInTheDocument();

    await userEvent.click(dialog.getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an error dialog", async () => {
    renderDemo();

    await userEvent.click(screen.getByRole("button", { name: "fail" }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("Failed")).toBeInTheDocument();
    expect(dialog.getByText("Server down.")).toBeInTheDocument();
  });

  it.each([
    ["Delete", true],
    ["Cancel", false],
  ])("confirm() resolves after %s with %s", async (button, expected) => {
    const answers: boolean[] = [];
    renderDemo((confirmed) => answers.push(confirmed));

    await userEvent.click(screen.getByRole("button", { name: "ask" }));
    const dialog = within(await screen.findByRole("alertdialog"));
    expect(dialog.getByText("Delete it?")).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: button }));

    await expect.poll(() => answers).toEqual([expected]);
  });

  it("confirm() resolves false when dismissed with Escape", async () => {
    const answers: boolean[] = [];
    renderDemo((confirmed) => answers.push(confirmed));

    await userEvent.click(screen.getByRole("button", { name: "ask" }));
    await screen.findByRole("alertdialog");
    await userEvent.keyboard("{Escape}");

    await expect.poll(() => answers).toEqual([false]);
  });
});
