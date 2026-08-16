import nodemailer from "nodemailer";
import { env } from "../config/env";

const transport = env.NODE_ENV === "test"
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      requireTLS: !env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
    });

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]!);
}

function validityText(expiresInSeconds: number): string {
  if (expiresInSeconds % 60 === 0) {
    const minutes = expiresInSeconds / 60;
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `${expiresInSeconds} seconds`;
}

export async function sendVerificationCode(input: {
  to: string;
  code: string;
  expiresInSeconds: number;
}): Promise<void> {
  const validity = validityText(input.expiresInSeconds);
  const applicationName = escapeHtml(env.SMTP_FROM_NAME);

  await transport.sendMail({
    from: { name: env.SMTP_FROM_NAME, address: env.SMTP_FROM_EMAIL },
    to: input.to,
    subject: "Book The Game verification code",
    text: [
      "Book The Game",
      "",
      `Verification Code: ${input.code}`,
      `This code is valid for ${validity}.`,
      "If you did not request this email, you can safely ignore it."
    ].join("\n"),
    html: [
      `<h1>${applicationName}</h1>`,
      "<p>Your Verification Code is:</p>",
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${input.code}</p>`,
      `<p>This code is valid for ${validity}.</p>`,
      "<p>If you did not request this email, you can safely ignore it.</p>"
    ].join("")
  });
}
