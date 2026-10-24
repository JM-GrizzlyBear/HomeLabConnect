import { createTransport, type Transporter } from "nodemailer";
import type {
  AccountEmails,
  TemporaryPasswordEmail,
} from "../../application/ports/AccountEmails.js";

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

const expiryFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Sends account emails over SMTP (Mailpit locally: http://localhost:8025). */
export class NodemailerAccountEmails implements AccountEmails {
  private readonly transport: Transporter;

  constructor(private readonly options: MailOptions) {
    this.transport = createTransport({
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

  sendStaffWelcome(email: TemporaryPasswordEmail): Promise<void> {
    return this.sendTemporaryPassword(
      email,
      "Your HomeLabConnect staff account",
      "An account has been created for you on HomeLabConnect.",
    );
  }

  sendTemporaryPasswordReissued(email: TemporaryPasswordEmail): Promise<void> {
    return this.sendTemporaryPassword(
      email,
      "Your new HomeLabConnect temporary password",
      "An admin has issued you a new temporary password. Your previous password no longer works.",
    );
  }

  private async sendTemporaryPassword(
    { to, firstName, temporaryPassword, expiresAt }: TemporaryPasswordEmail,
    subject: string,
    intro: string,
  ): Promise<void> {
    const loginUrl = new URL("/login", this.options.appUrl).toString();
    const expiry = expiryFormat.format(expiresAt);
    const text = [
      `Hi ${firstName},`,
      "",
      intro,
      "",
      `Email: ${to}`,
      `Temporary password: ${temporaryPassword}`,
      "",
      `Sign in at ${loginUrl} and choose a new password.`,
      `This temporary password expires on ${expiry}. After that, ask an admin to send you a new one.`,
    ].join("\n");
    const html = `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>${escapeHtml(intro)}</p>
      <p>Email: <strong>${escapeHtml(to)}</strong><br>
      Temporary password: <strong style="font-family: monospace">${escapeHtml(temporaryPassword)}</strong></p>
      <p><a href="${escapeHtml(loginUrl)}">Sign in</a> and choose a new password.</p>
      <p>This temporary password expires on <strong>${escapeHtml(expiry)}</strong>.
      After that, ask an admin to send you a new one.</p>`;

    try {
      await this.transport.sendMail({ from: this.options.from, to, subject, text, html });
    } catch (error) {
      console.error(`Could not send "${subject}" to ${to}:`, error);
      throw error;
    }
  }
}
