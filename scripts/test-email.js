// create file: test-email.js (run from project root)
// Usage (PowerShell/terminal): SMTP_HOST=... SMTP_PORT=... SMTP_USER=... SMTP_PASS=... SMTP_FROM=... node test-email.js

import nodemailer from "nodemailer";

async function main() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@example.com";
  if (!host || !user || !pass) {
    console.error("set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT, SMTP_FROM)");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to: user, // quick test to yourself
    subject: "Inventos test email",
    text: "This is a test email from Inventos.",
  });

  console.log("Message sent:", info.messageId || info);
  await transporter.close();
}

main().catch((err) => {
  console.error("Send failed:", err);
  process.exit(1);
});