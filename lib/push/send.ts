import "server-only";
import webpush, { type PushSubscription } from "web-push";
import { getWebPushConfig } from "@/lib/push/config";

export type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
  content_encoding: string;
};

export type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

function configureWebPush() {
  const config = getWebPushConfig();
  if (!config) throw new Error("web_push_not_configured");
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
}

function toWebPushSubscription(subscription: StoredPushSubscription): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth_key
    }
  };
}

export async function sendWebPush(subscription: StoredPushSubscription, message: PushMessage) {
  configureWebPush();
  return webpush.sendNotification(
    toWebPushSubscription(subscription),
    JSON.stringify({
      title: message.title.slice(0, 160),
      body: message.body.slice(0, 500),
      url: message.url.startsWith("/") ? message.url : "/",
      tag: message.tag
    }),
    {
      TTL: 60 * 60 * 24,
      urgency: "high"
    }
  );
}
