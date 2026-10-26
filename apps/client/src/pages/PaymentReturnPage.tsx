import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { useFeedback } from "../feedback/feedbackContext";

interface PaymentReturnPageProps {
  /** Stripe sends the patient back here after paying, or after leaving the checkout. */
  outcome: "success" | "cancel";
}

/** Where Stripe's checkout returns to: says how it went, then opens the appointment again. */
export function PaymentReturnPage({ outcome }: PaymentReturnPageProps) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const feedback = useFeedback();
  const done = useRef(false);
  const appointmentId = params.get("appointment");

  useEffect(() => {
    if (!appointmentId || done.current) return;
    done.current = true;
    if (outcome === "success") {
      feedback.success({
        title: "Payment received",
        description: "It shows on your appointment in a moment.",
      });
    }
    void navigate(`/app/appointments/${appointmentId}`, { replace: true });
  }, [appointmentId, outcome, feedback, navigate]);

  if (!appointmentId) return <Navigate to="/app/appointments/mine" replace />;
  return <FullPageSpinner />;
}
