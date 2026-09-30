import { render, screen, waitForElementToBeRemoved, within } from "@testing-library/react";
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
      <button
        onClick={() =>
          feedback.success({
            title: "Created",
            content: <p>abc-123</p>,
            closeLabel: "I've saved it",
          })
        }
      >
        succeed with a secret
      </button>
      <button onClick={() => feedback.error({ title: "Failed", description: "Server down." })}>
        fail
      </button>
      <button
        onClick={async () => {
          const confirmed = await feedback.confirm({
            title: "Delete it?",
            confirmLabel: "Delete",
            destructive: true,
          });
          onAnswer?.(confirmed);
        }}
      >
        ask
      </button>
    </>
  );
}

function renderDemo(onAnswer?: (confirmed: boolean) => void, toastDurationMs?: number) {
  render(
    <FeedbackProvider toastDurationMs={toastDurationMs}>
      <Demo onAnswer={onAnswer} />
    </FeedbackProvider>,
  );
}

describe("FeedbackProvider", () => {
  it("shows success as a toast that goes away on its own, without a dialog", async () => {
    renderDemo(undefined, 100);

    await userEvent.click(screen.getByRole("button", { name: "succeed" }));

    const toasts = within(screen.getByRole("status"));
    expect(toasts.getByText("Saved")).toBeInTheDocument();
    expect(toasts.getByText("All good.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitForElementToBeRemoved(() => toasts.queryByText("Saved"));
  });

  it("closes a toast with its dismiss button", async () => {
    renderDemo(undefined, 60_000);

    await userEvent.click(screen.getByRole("button", { name: "succeed" }));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("keeps a success with something to copy in a dialog until it's closed", async () => {
    renderDemo();

    await userEvent.click(screen.getByRole("button", { name: "succeed with a secret" }));
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText("abc-123")).toBeInTheDocument();

    await userEvent.click(dialog.getByRole("button", { name: "I've saved it" }));
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
