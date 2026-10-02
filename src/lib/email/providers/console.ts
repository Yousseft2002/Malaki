import { logger } from "@/lib/logger";
import type { EmailProvider } from "../types";

/** Development provider: logs the email instead of sending it. */
export const consoleProvider: EmailProvider = {
  name: "console",
  async send(message) {
    logger.info("email.console", { to: message.to, subject: message.subject });
    if (process.env.NODE_ENV !== "production") console.log(`\n--- EMAIL to ${message.to} ---\n${message.text}\n---\n`);
  },
};
