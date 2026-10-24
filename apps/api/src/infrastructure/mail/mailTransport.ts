import { createTransport, type Transporter } from "nodemailer";

export interface MailOptions {
  smtpHost: string;
  smtpPort: number;
  /** Login for a real mail provider (Brevo, Resend); Mailpit needs none. */
  smtpUser?: string;
  smtpPass?: string;
  from: string;
  /** The client's base URL, for the sign-in link. */
  appUrl: string;
}

/** An SMTP connection: Mailpit locally (no login), a real provider such as Brevo in production. */
export function createMailTransport(options: MailOptions): Transporter {
  return createTransport({
    host: options.smtpHost,
    port: options.smtpPort,
    // Port 465 speaks TLS from the start; 587 and 2525 upgrade with STARTTLS
    secure: options.smtpPort === 465,
    auth:
      options.smtpUser && options.smtpPass
        ? { user: options.smtpUser, pass: options.smtpPass }
        : undefined,
  });
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
