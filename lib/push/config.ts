import "server-only";

export type WebPushConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export function getWebPushConfig(): WebPushConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) return null;
  if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) return null;

  return { publicKey, privateKey, subject };
}
