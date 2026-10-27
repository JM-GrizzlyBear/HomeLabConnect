import { formatPeso, type PaymentListItem } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appointmentStatusLabels } from "../../format/appointments";
import {
  paymentRecordStatusLabels,
  paymentRecordStatusVariants,
  providerLabels,
} from "../../format/payments";

interface PaymentsTableProps {
  payments: PaymentListItem[];
  /** Shows a Refund button on payments with money left; leave out for a read-only table. */
  onRefund?(payment: PaymentListItem): void;
}

/** Staff: payments with their visit, patient, method, amount and status. */
export function PaymentsTable({ payments, onRefund }: PaymentsTableProps) {
  return (
    <Table className="min-w-200">
      <TableHeader>
        <TableRow>
          <TableHead>Paid</TableHead>
          <TableHead>Appointment</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          {onRefund && (
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => {
          const left = payment.amountCentavos - payment.refundedCentavos;
          const settled = payment.status === "paid" || payment.status === "partially_refunded";
          return (
            <TableRow key={payment.id}>
              <TableCell>
                {payment.paidAt ? format(parseISO(payment.paidAt), "MMM d, yyyy h:mm a") : "—"}
              </TableCell>
              <TableCell>
                <Link
                  to={`/app/appointments/${payment.appointmentId}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {payment.appointment.code}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {appointmentStatusLabels[payment.appointment.status]}
                </p>
              </TableCell>
              <TableCell>{payment.appointment.patient.name}</TableCell>
              <TableCell>{providerLabels[payment.provider]}</TableCell>
              <TableCell>
                {formatPeso(payment.amountCentavos)}
                {payment.refundedCentavos > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatPeso(payment.refundedCentavos)} refunded
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={paymentRecordStatusVariants[payment.status]}>
                    {paymentRecordStatusLabels[payment.status]}
                  </Badge>
                  {payment.needsRefund && <Badge variant="destructive">Needs refund</Badge>}
                </div>
              </TableCell>
              {onRefund && (
                <TableCell className="text-right">
                  {settled && left > 0 && (
                    <Button size="sm" variant="outline" onClick={() => onRefund(payment)}>
                      Refund
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
