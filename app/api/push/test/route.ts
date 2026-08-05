import { NextResponse } from "next/server";
import { sendWebPush, type StoredPushSubscription } from "@/lib/push/send";
import { getWebPushConfig } from "@/lib/push/config";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function pushStatus(error: unknown) {
  return typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
}

export async function POST() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  if (!hasSupabaseAdminEnv()) return NextResponse.json({ error: "As notificações ainda não estão disponíveis. Tente novamente mais tarde." }, { status: 503 });
  if (!getWebPushConfig()) return NextResponse.json({ error: "As notificações ainda estão sendo configuradas. Tente novamente mais tarde." }, { status: 503 });

  const admin = createAdminClient();
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth_key,content_encoding")
    .eq("user_id", data.user.id)
    .eq("enabled", true);

  if (error || !subscriptions?.length) {
    return NextResponse.json({ error: "A inscrição foi salva, mas este dispositivo ainda não está pronto para receber o teste." }, { status: 409 });
  }

  const results = await Promise.allSettled(
    subscriptions.map((subscription) => sendWebPush(subscription as StoredPushSubscription, {
      title: "Notificações ativadas",
      body: "Você receberá atualizações importantes do Portal Encaixe neste dispositivo.",
      url: "/"
    }))
  );

  const expiredEndpoints = results.flatMap((result, index) =>
    result.status === "rejected" && [404, 410].includes(pushStatus(result.reason)) ? [subscriptions[index].endpoint] : []
  );
  if (expiredEndpoints.length) await admin.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);

  if (!results.some((result) => result.status === "fulfilled")) {
    return NextResponse.json({ error: "As notificações foram autorizadas, mas o navegador não aceitou o teste agora. Tente novamente em alguns minutos." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
