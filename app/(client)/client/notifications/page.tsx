import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { markMarketplaceNotificationsReadAction } from "@/lib/actions/marketplace";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function ClientNotificationsPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data } = await supabase.from("marketplace_notifications").select("id,title,body,link_path,read_at,created_at").eq("user_id", userData.user?.id).order("created_at", { ascending: false });
  return <AppShell eyebrow="Cliente" title="Notificações"><form action={markMarketplaceNotificationsReadAction} className="mb-4 flex justify-end"><button className="rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-sm font-bold text-white">Marcar todas como lidas</button></form><div className="grid gap-3">{data?.length ? data.map((item) => <article key={item.id} className={`rounded-2xl border p-5 ${item.read_at ? "border-slate-200 bg-white" : "border-orange-200 bg-orange-50/40"}`}><div className="flex justify-between gap-3"><h2 className="font-bold text-[#0F2D4E]">{item.title}</h2><time className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString("pt-BR")}</time></div><p className="mt-2 text-sm text-slate-600">{item.body}</p>{item.link_path ? <Link href={item.link_path} className="mt-3 inline-block text-sm font-bold text-[#F2811D]">Abrir →</Link> : null}</article>) : <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Nenhuma notificação.</p>}</div></AppShell>;
}
