import nodemailer from "nodemailer";

/**
 * Creates a fresh Nodemailer transport using current env vars.
 *
 * WHY LAZY (not module-level):
 *   Module-level `nodemailer.createTransport(...)` captures env var values at
 *   import time. In Next.js API routes the env vars are always populated, but
 *   creating the transport eagerly still locks in whatever values exist at
 *   that moment. A lazy factory guarantees we always use the live env values
 *   and avoids subtle "undefined credentials" bugs in test/CI environments.
 *
 * TLS NOTE:
 *   `tls: { ciphers: 'SSLv3' }` is removed — that cipher string is deprecated
 *   in OpenSSL 1.1+ (Node 12+) and can cause handshake failures with modern
 *   SMTP relay servers including Brevo. Removing it lets Node use its default
 *   (secure) cipher list, which Brevo port 587 + STARTTLS expects.
 */
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,          // STARTTLS — not SSL-wrapped. Required for port 587.
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true, // Always verify the server certificate in production.
    },
    connectionTimeout: 10_000, // 10 s — avoids hanging the API route forever.
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Sends an HTML email via Brevo SMTP (Nodemailer).
 *
 * Returns the Nodemailer info object on success.
 * Throws on SMTP failure so the caller can handle/log it.
 * Silently skips (with a warning) when credentials are not configured.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    const recipients = Array.isArray(to) ? to.join(", ") : to;
    console.warn(
      `[mailer] SMTP credentials not configured — skipping email to: ${recipients}`
    );
    return null;
  }

  const toList = Array.isArray(to) ? to.join(",") : to;
  const transporter = createTransport();

  try {
    const info = await transporter.sendMail({
      from: `"EcoPlate" <${smtpUser}>`,
      to: toList,
      subject,
      html,
    });

    console.log(`[mailer] Email sent successfully → messageId: ${info.messageId} | to: ${toList}`);
    return info;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[mailer] SMTP send failed for "${toList}": ${msg}`);
    throw error; // Re-throw so the API route can handle per-recipient failures.
  }
}
