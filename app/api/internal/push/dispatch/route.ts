import { NextResponse } from "next/server";
import { sendWebPush, type StoredPushSubscription } from "@/lib/push/send";
import { getWebPushConfig } from "@/lib/push/config";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PushJob = { id: string; user_id: string; title: string; body: string; url: string; attempts: number };

function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

function pushStatus(error: unknown) {
  return typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!hasSupabaseAdminEnv()) return NextResponse.json({ error: "Configuração do servidor indisponível." }, { status: 503 });
  if (!getWebPushConfig()) return NextResponse.json({ error: "As chaves de notificações não estão configuradas." }, { status: 503 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_push_notification_jobs", { batch_size: 25 });
  if (error) {
    console.error("[push] unable to claim jobs", error);
    return NextResponse.json({ error: "Não foi possível preparar as notificações." }, { status: 500 });
  }

  const jobs = (data ?? []) as PushJob[];
  if (!jobs.length) return NextResponse.json({ processed: 0 });

  const userIds = [...new Set(jobs.map((job) => job.user_id))];
  const { data: rawSubscriptions, error: subscriptionsError } = await admin
    .from("push_subscriptions")
    .select("user_id,endpoint,p256dh,auth_key,content_encoding")
    .in("user_id", userIds)
    .eq("enabled", true);
  if (subscriptionsError) return NextResponse.json({ error: "Não foi possível carregar os dispositivos." }, { status: 500 });

  const byUser = new Map<string, StoredPushSubscription[]>();
  for (const subscription of rawSubscriptions ?? []) {
    const current = byUser.get(subscription.user_id) ?? [];
    current.push(subscription as StoredPushSubscription);
    byUser.set(subscription.user_id, current);
  }

  let delivered = 0;
  let failed = 0;
  const now = new Date().toISOString();

  for (const job of jobs) {
    const subscriptions = byUser.get(job.user_id) ?? [];
    if (!subscriptions.length) {
      await admin.from("push_notification_outbox").update({ status: "delivered", processed_at: now, last_error: null }).eq("id", job.id);
      delivered += 1;
      continue;
    }

    const results = await Promise.allSettled(
      subscriptions.map((subscription) => sendWebPush(subscription, { title: job.title, body: job.body, url: job.url, tag: job.id }))
    );
    const expiredEndpoints = results.flatMap((result, index) =>
      result.status === "rejected" && [404, 410].includes(pushStatus(result.reason)) ? [subscriptions[index].endpoint] : []
    );
    if (expiredEndpoints.length) await admin.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);

    const successfulEndpoints = results.flatMap((result, index) => result.status === "fulfilled" ? [subscriptions[index].endpoint] : []);
    if (successfulEndpoints.length) {
      await admin.from("push_subscriptions").update({ last_success_at: now, failure_count: 0, last_failure_at: null }).in("endpoint", successfulEndpoints);
    }

    const temporaryFailures = results.filter((result) => result.status === "rejected" && ![404, 410].includes(pushStatus(result.reason)));
    if (!temporaryFailures.length || successfulEndpoints.length) {
      await admin.from("push_notification_outbox").update({ status: "delivered", processed_at: now, last_error: null }).eq("id", job.id);
      delivered += 1;
      continue;
    }

    const errorMessage = temporaryFailures[0].status === "rejected" && temporaryFailures[0].reason instanceof Error
      ? temporaryFailures[0].reason.message.slice(0, 500)
      : "Falha temporária ao entregar a notificação.";
    const terminal = job.attempts >= 3;
    await admin.from("push_notification_outbox").update({
      status: terminal ? "failed" : "pending",
      processed_at: terminal ? now : null,
      last_error: errorMessage
    }).eq("id", job.id);
    failed += 1;
  }

  return NextResponse.json({ processed: jobs.length, delivered, failed });
}
