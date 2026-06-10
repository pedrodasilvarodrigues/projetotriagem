import { AppShell } from "@/components/app/shell";
import { markNotificationsReadAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function CompanyNotificationsPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: notifications } = await supabase.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", userData.user?.id).order("created_at", { ascending: false });

  return (
    <AppShell eyebrow="Empresa" title="Notificacoes">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form action={markNotificationsReadAction} className="mb-4 flex justify-end"><button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" type="submit">Marcar todas como lidas</button></form>
        <div className="space-y-3">
          {(notifications ?? []).map((item) => <article key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-4"><h2 className="font-semibold">{item.title}</h2><p className="mt-2 text-sm text-slate-600">{item.body}</p><p className="mt-2 text-xs text-slate-500">{item.read_at ? "Lida" : "Nao lida"}</p></article>)}
          {(notifications ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma notificacao encontrada.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}
