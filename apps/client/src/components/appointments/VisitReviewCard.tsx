import type { AppointmentView } from "@homelabconnect/shared";
import { StarIcon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ApiError } from "../../api/apiClient";
import { fetchAppointmentReview, reviewAppointment } from "../../api/appointments";
import { useCan } from "../../auth/useCan";
import { useFeedback } from "../../feedback/feedbackContext";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { ContentCard } from "../layout/ContentCard";

const FINISHED = ["collected", "not_collected"];

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

/**
 * Once a visit is done, its patient rates it 1–5 (once); staff see what they said. Nothing
 * shows before the visit, or when there's no rating to see.
 */
export function VisitReviewCard({
  appointment,
  isPatient,
}: {
  appointment: AppointmentView;
  isPatient: boolean;
}) {
  const can = useCan();
  const finished = FINISHED.includes(appointment.status);
  // Wrapped, so "not rated yet" (null) is told apart from "still loading"
  const { data, reload } = useApiQuery(
    queryKeys.review(appointment.id),
    async (signal) => ({ review: await fetchAppointmentReview(appointment.id, signal) }),
    { enabled: finished, errorMessage: "Could not load the rating." },
  );
  if (!finished || !data) return null;
  const { review } = data;

  if (review) {
    return (
      <ContentCard title={isPatient ? "Your rating" : "Patient's rating"} className="lg:col-span-5">
        <Stars value={review.rating} />
        {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
      </ContentCard>
    );
  }
  if (!isPatient || !can("appointments.review")) return null;
  return <ReviewForm appointmentId={appointment.id} onRated={reload} />;
}

function ReviewForm({ appointmentId, onRated }: { appointmentId: string; onRated(): void }) {
  const feedback = useFeedback();
  const [state, setState] = useState({ stars: 0, comment: "", sending: false });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.stars === 0) return;
    setState((current) => ({ ...current, sending: true }));
    try {
      await reviewAppointment(appointmentId, {
        rating: state.stars,
        comment: state.comment.trim() || null,
      });
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
    <ContentCard title="How was your visit?" className="lg:col-span-5">
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
              placeholder="Anything we should know?"
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
