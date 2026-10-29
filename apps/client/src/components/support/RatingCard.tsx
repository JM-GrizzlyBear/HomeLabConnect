import { StarIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ApiError } from "../../api/apiClient";
import { rateTicket } from "../../api/support";
import { useFeedback } from "../../feedback/feedbackContext";
import { ContentCard } from "../layout/ContentCard";

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={cn(
            "size-5",
            star <= value ? "fill-amber-400 text-amber-400" : "text-slate-300",
          )}
        />
      ))}
    </span>
  );
}

/** Once a ticket is closed, its patient rates the help 1–5, once. */
export function RatingCard({
  ticketId,
  rating,
  comment,
  onRated,
}: {
  ticketId: string;
  rating: number | null;
  comment: string | null;
  onRated(): void;
}) {
  const feedback = useFeedback();
  const [state, setState] = useState({ stars: 0, comment: "", sending: false });

  if (rating !== null) {
    return (
      <ContentCard title="Your rating">
        <Stars value={rating} />
        {comment && <p className="mt-2 text-sm text-muted-foreground">{comment}</p>}
      </ContentCard>
    );
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.stars === 0) return;
    setState((current) => ({ ...current, sending: true }));
    try {
      await rateTicket(ticketId, { rating: state.stars, comment: state.comment.trim() || null });
      feedback.success({ title: "Thanks for your rating" });
      onRated();
    } catch (failure) {
      setState((current) => ({ ...current, sending: false }));
      feedback.error({
        title: "Couldn't save your rating",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <ContentCard title="How did we do?">
      <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={state.stars === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              className="rounded p-0.5 hover:bg-amber-50"
              onClick={() => setState((current) => ({ ...current, stars: star }))}
            >
              <StarIcon
                className={cn(
                  "size-7",
                  star <= state.stars ? "fill-amber-400 text-amber-400" : "text-slate-300",
                )}
              />
            </button>
          ))}
        </div>
        <FormField label="Comment" optional>
          {(control) => (
            <Textarea
              {...control}
              rows={2}
              maxLength={500}
              value={state.comment}
              onChange={(event) =>
                setState((current) => ({ ...current, comment: event.target.value }))
              }
            />
          )}
        </FormField>
        <Button type="submit" size="sm" loading={state.sending} disabled={state.stars === 0}>
          Send rating
        </Button>
      </form>
    </ContentCard>
  );
}
