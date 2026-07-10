import nodemailer from "nodemailer";

// SMTP_HOST/PORT/USER/PASS — set these once you have a mailbox to send
// from (e.g. a Hostinger email account under optimaflexpay.com, or any
// SMTP provider). Until they're set, reset links are logged to the server
// console instead of emailed — safe for local dev, but real users won't
// get an email until SMTP is configured in production.
const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!transporter) {
    console.log(`[password reset] SMTP not configured. Reset link for ${to}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Reset your Adepa password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `<p>Reset your password by clicking the link below:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  });
}
