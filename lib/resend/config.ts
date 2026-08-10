import "server-only";

export const DEFAULT_RESEND_FROM = "Portal Encaixe <noreply@portalencaixe.com.br>";

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não está configurada no ambiente do servidor.");
  }

  return apiKey;
}

export function getResendFromEmail() {
  return DEFAULT_RESEND_FROM;
}
