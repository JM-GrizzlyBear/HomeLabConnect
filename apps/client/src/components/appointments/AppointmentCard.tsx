import { type AppointmentView, formatPeso } from "@homelabconnect/shared";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  appointmentStatusLabels,
  appointmentStatusVariants,
  formatVisit,
} from "../../format/appointments";

/** One appointment in a list: when, what, the status and the total. */
export function AppointmentCard({ appointment }: { appointment: AppointmentView }) {
  return (
    <li>
      <Link
        to={`/app/appointments/${appointment.id}`}
        className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-slate-50 sm:px-2"
      >
        <span>
          <span className="block font-medium">
            {formatVisit(appointment.date, appointment.slot)}
          </span>
          <span className="block text-sm text-muted-foreground">
            {appointment.code} · {appointment.lines.map((line) => line.name).join(", ")}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-sm">
            {formatPeso(appointment.totalCentavos)}
            <span className="ml-1.5 text-xs text-muted-foreground">Unpaid</span>
          </span>
          <Badge variant={appointmentStatusVariants[appointment.status]}>
            {appointmentStatusLabels[appointment.status]}
          </Badge>
        </span>
      </Link>
    </li>
  );
}
