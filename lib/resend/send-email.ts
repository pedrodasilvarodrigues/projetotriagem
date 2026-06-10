import { createResendClient } from "@/lib/resend/client";
import { emailTemplates, type EmailTemplateKey } from "@/lib/resend/templates";

export async function sendTransactionalEmail(input: { to: string; template: EmailTemplateKey; variables: Record<string, string> }) {
  const resend = createResendClient();
  const template = emailTemplates[input.template](input.variables);

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: input.to,
    subject: template.subject,
    html: template.html
  });
}
