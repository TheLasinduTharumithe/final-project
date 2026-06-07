// Purpose: Nodemailer transport setup for sending transactional email.
import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Use an App Password for Gmail
  },
});

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const toArray = Array.isArray(to) ? to : [to];
    
    // Safety check - avoid sending if credentials are not configured or no recipients
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || toArray.length === 0) {
      console.warn("Email credentials not set or recipient list empty. Skipping email send.");
      return false;
    }

    // We can use Bcc for multiple recipients to protect their privacy
    await transporter.sendMail({
      from: `"EcoPlate Notifications" <${process.env.SMTP_USER}>`,
      bcc: toArray, // BCC prevents charities from seeing each other's emails
      subject,
      html,
    });
    
    console.log(`Successfully sent email to ${toArray.length} recipients.`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
