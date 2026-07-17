import { AppShell } from "@/components/app/shell";
import { markNotificationsReadAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";
import { markMarketplaceNotificationsReadAction } from "@/lib/actions/marketplace";

export default async function ProfessionalNotificationsPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: notifications } = await supabase.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", userData.user?.id).order("created_at", { ascending: false });
  const { data: marketplaceNotifications } = await supabase.from("marketplace_notifications").select("id,title,body,read_at,created_at,link_path").eq("user_id", userData.user?.id).order("created_at", { ascending: false });

  return (
    <AppShell eyebrow="Profissional" title="Notificações">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form action={markNotificationsReadAction} className="mb-4 flex justify-end">
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" type="submit">Marcar todas como lidas</button>
        </form>
        <form action={markMarketplaceNotificationsReadAction} className="mb-4 flex justify-end"><button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" type="submit">Marcar mensagens de serviços como lidas</button></form>
        <div className="space-y-3">
          {(notifications ?? []).map((notification) => (
            <article key={notification.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{notification.title}</h2>
                <span className="text-xs text-slate-500">{notification.read_at ? "Lida" : "Não lida"}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{notification.body}</p>
            </article>
          ))}
          {(notifications ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma notificação encontrada.</p> : null}
          {(marketplaceNotifications ?? []).map((notification) => <article key={`marketplace-${notification.id}`} className="rounded-md border border-orange-200 bg-orange-50/40 p-4"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{notification.title}</h2><span className="text-xs text-slate-500">{notification.read_at ? "Lida" : "Não lida"}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{notification.body}</p>{notification.link_path ? <a href={notification.link_path} className="mt-2 inline-block text-sm font-bold text-[#F2811D]">Abrir conversa →</a> : null}</article>)}
        </div>
      </section>
    </AppShell>
  );
}
