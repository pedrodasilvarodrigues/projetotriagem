import "server-only";

import { createResendClient } from "@/lib/resend/client";
import { getResendFromEmail } from "@/lib/resend/config";
import { emailTemplates, type EmailTemplateKey } from "@/lib/resend/templates";

export class TransactionalEmailError extends Error {
  constructor(
    message: string,
    readonly providerCode?: string
  ) {
    super(message);
    this.name = "TransactionalEmailError";
  }
}

type TransactionalEmailInput = {
  to: string;
  template: EmailTemplateKey;
  variables: Record<string, string>;
  idempotencyKey?: string;
};

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const resend = createResendClient();
  const template = emailTemplates[input.template](input.variables);
  const plainText = "text" in template && typeof template.text === "string" ? template.text : undefined;

  const { data, error } = await resend.emails.send(
    {
      from: getResendFromEmail(),
      to: input.to,
      subject: template.subject,
      html: template.html,
      ...(plainText ? { text: plainText } : {})
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
  );

  if (error) {
    throw new TransactionalEmailError(error.message || "O Resend recusou o envio do e-mail.", error.name);
  }

  if (!data?.id) {
    throw new TransactionalEmailError("O Resend não confirmou o envio do e-mail.");
  }

  return { id: data.id };
}
