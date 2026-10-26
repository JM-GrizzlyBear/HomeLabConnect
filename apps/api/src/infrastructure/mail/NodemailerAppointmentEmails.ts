import { formatPeso } from "@homelabconnect/shared";
import type { Transporter } from "nodemailer";
import type {
  AppointmentEmails,
  AppointmentNotice,
} from "../../application/ports/AppointmentEmails.js";
import type { Appointment } from "../../domain/appointments/appointment.js";
import { createMailTransport, escapeHtml, type MailOptions } from "./mailTransport.js";

const visitFormat = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Friday, October 30, 2026 at 8:00 AM". */
function visitTime(date: string, slot: string): string {
  const [hours = 0, minutes = 0] = slot.split(":").map(Number);
  const suffix = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${visitFormat.format(new Date(`${date}T00:00:00Z`))} at ${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

const notices: Record<
  AppointmentNotice,
  { subject: (code: string) => string; intro: (a: Appointment) => string }
> = {
  received: {
    subject: (code) => `We received your booking ${code}`,
    intro: () => "Thank you for booking a home visit. We'll confirm it shortly.",
  },
  confirmed: {
    subject: (code) => `Your home visit ${code} is confirmed`,
    intro: () => "Your home visit is confirmed. Our med team will see you then.",
  },
  rejected: {
    subject: (code) => `We couldn't accept your booking ${code}`,
    intro: (a) => `We're sorry, we couldn't accept your booking. Reason: ${a.decisionNote ?? "—"}`,
  },
  new_time_proposed: {
    subject: (code) => `A new time for your home visit ${code}`,
    intro: (a) =>
      a.openProposal
        ? `We'd like to move your visit to ${visitTime(a.openProposal.date, a.openProposal.slot)}. Reason: ${a.openProposal.reason}. Please accept or decline it in the app.`
        : "We'd like to move your visit. Please check the app.",
  },
  cancelled: {
    subject: (code) => `Your home visit ${code} was cancelled`,
    intro: (a) =>
      a.decisionNote
        ? `Your home visit was cancelled. Reason: ${a.decisionNote}`
        : "Your home visit was cancelled.",
  },
  payment_received: {
    subject: (code) => `Payment received for ${code}`,
    intro: () => "Thank you, we received your payment.",
  },
  payment_refunded: {
    subject: (code) => `Refund for ${code}`,
    intro: (a) =>
      a.paymentStatus === "refunded"
        ? "We refunded your payment in full. Card refunds take 5 to 10 days to show on your statement."
        : "We refunded part of your payment. Card refunds take 5 to 10 days to show on your statement.",
  },
};

/** Tells patients about their appointments over SMTP (Mailpit locally, Brevo in production). */
export class NodemailerAppointmentEmails implements AppointmentEmails {
  private readonly transport: Transporter;

  constructor(private readonly options: MailOptions) {
    this.transport = createMailTransport(options);
  }

  async send(notice: AppointmentNotice, appointment: Appointment): Promise<void> {
    const { subject, intro } = notices[notice];
    const link = new URL(`/app/appointments/${appointment.id}`, this.options.appUrl).toString();
    const firstName = appointment.patientName.split(" ")[0] ?? appointment.patientName;
    const when = visitTime(appointment.date, appointment.slot);
    const tests = appointment.lines.map((line) => line.name).join(", ");
    const total = formatPeso(appointment.totalCentavos);

    const text = [
      `Hi ${firstName},`,
      "",
      intro(appointment),
      "",
      `Booking: ${appointment.code}`,
      `Visit: ${when}`,
      `Address: ${appointment.address}`,
      `Tests: ${tests}`,
      `Total: ${total}`,
      "",
      `See your appointment: ${link}`,
    ].join("\n");
    const html = `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>${escapeHtml(intro(appointment))}</p>
      <p>Booking: <strong>${escapeHtml(appointment.code)}</strong><br>
      Visit: <strong>${escapeHtml(when)}</strong><br>
      Address: ${escapeHtml(appointment.address)}<br>
      Tests: ${escapeHtml(tests)}<br>
      Total: <strong>${escapeHtml(total)}</strong></p>
      <p><a href="${escapeHtml(link)}">See your appointment</a></p>`;

    try {
      await this.transport.sendMail({
        from: this.options.from,
        to: appointment.patientEmail,
        subject: subject(appointment.code),
        text,
        html,
      });
    } catch (error) {
      console.error(
        `Could not send "${subject(appointment.code)}" to ${appointment.patientEmail}:`,
        error,
      );
      throw error;
    }
  }
}
