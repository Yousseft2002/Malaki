export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

/** Implement this to plug in any email service. Select it with EMAIL_PROVIDER. */
export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage & { from: string }): Promise<void>;
}
