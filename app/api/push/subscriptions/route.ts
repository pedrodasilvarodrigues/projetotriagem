import { NextResponse } from "next/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SubscriptionPayload = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

function parseSubscription(payload: SubscriptionPayload) {
  const endpoint = typeof payload.endpoint === "string" ? payload.endpoint.trim() : "";
  const p256dh = typeof payload.keys?.p256dh === "string" ? payload.keys.p256dh.trim() : "";
  const auth = typeof payload.keys?.auth === "string" ? payload.keys.auth.trim() : "";

  try {
    const url = new URL(endpoint);
    if ((url.protocol !== "https:" && url.hostname !== "localhost") || !p256dh || !auth) return null;
  } catch {
    return null;
  }

  if (endpoint.length > 2048 || p256dh.length > 512 || auth.length > 512) return null;
  return { endpoint, p256dh, auth };
}

async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "As notificações ainda não estão disponíveis. Tente novamente mais tarde." }, { status: 503 });
  }

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const subscription = parseSubscription(await request.json().catch(() => ({})));
  if (!subscription) return NextResponse.json({ error: "O navegador não retornou uma inscrição de notificação válida." }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth_key: subscription.auth,
      content_encoding: "aes128gcm",
      user_agent: request.headers.get("user-agent")?.slice(0, 1000) ?? null,
      enabled: true,
      failure_count: 0,
      last_failure_at: null
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("[push] subscription upsert failed", error);
    return NextResponse.json({ error: "Não foi possível salvar as notificações neste dispositivo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!hasSupabaseAdminEnv()) return NextResponse.json({ ok: true });
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const subscription = parseSubscription(await request.json().catch(() => ({})));
  if (!subscription) return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });

  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", subscription.endpoint);

  if (error) return NextResponse.json({ error: "Não foi possível remover as notificações deste dispositivo." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
