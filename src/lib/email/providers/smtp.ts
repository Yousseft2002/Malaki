import nodemailer from "nodemailer";
import type { EmailProvider } from "../types";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
}

/** Works with any transactional email service that offers SMTP credentials. */
export function createSmtpProvider(config: SmtpConfig): EmailProvider {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
  });
  return {
    name: "smtp",
    async send(message) {
      await transport.sendMail({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    },
  };
}
