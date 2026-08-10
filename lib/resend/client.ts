import "server-only";

import { Resend } from "resend";
import { getResendApiKey } from "@/lib/resend/config";

let resendClient: Resend | null = null;

export function createResendClient() {
  if (!resendClient) {
    resendClient = new Resend(getResendApiKey());
  }

  return resendClient;
}
