import { TICKET_MESSAGE_MAX_LENGTH } from "@homelabconnect/shared";
import { SendIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "../../api/apiClient";
import { postMessage } from "../../api/support";
import { useFeedback } from "../../feedback/feedbackContext";
import { AttachButton } from "./AttachButton";

/** Writes in a ticket's chat: text, a photo or PDF, or both. */
export function ChatComposer({
  ticketId,
  hint,
  onSent,
}: {
  ticketId: string;
  hint?: string;
  onSent(): void;
}) {
  const feedback = useFeedback();
  const [state, setState] = useState({ body: "", file: null as File | null, sending: false });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state.body.trim() && !state.file) return;
    setState((current) => ({ ...current, sending: true }));
    try {
      await postMessage(ticketId, { body: state.body, file: state.file });
      setState({ body: "", file: null, sending: false });
      onSent();
    } catch (failure) {
      setState((current) => ({ ...current, sending: false }));
      feedback.error({
        title: "Couldn't send the message",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <form className="mt-4 grid gap-3 border-t pt-4" onSubmit={handleSubmit} noValidate>
      <FormField label="Your message" hideLabel hint={hint}>
        {(control) => (
          <Textarea
            {...control}
            rows={3}
            maxLength={TICKET_MESSAGE_MAX_LENGTH}
            placeholder="Write a message…"
            value={state.body}
            onChange={(event) => setState((current) => ({ ...current, body: event.target.value }))}
            onKeyDown={(event) => {
              // Ctrl/⌘ + Enter sends
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
        )}
      </FormField>
      <div className="flex flex-wrap items-center gap-3">
        <AttachButton
          file={state.file}
          onChange={(file) => setState((current) => ({ ...current, file }))}
        />
        <Button
          type="submit"
          size="sm"
          loading={state.sending}
          disabled={!state.body.trim() && !state.file}
          className="ml-auto"
        >
          <SendIcon />
          Send
        </Button>
      </div>
    </form>
  );
}
