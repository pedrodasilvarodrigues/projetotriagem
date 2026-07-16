import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const labels: Record<string,string> = { awaiting_response: "Aguardando resposta", accepted: "Aceita", rejected: "Recusada", in_progress: "Em andamento", completed: "Concluída", cancelled: "Cancelada", disputed: "Em disputa", sent: "Enviada" };
export default async function ClientRequestsPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: client } = await supabase.from("client_profiles").select("id").eq("user_id", userData.user?.id).maybeSingle();
  const { data } = client ? await supabase.from("service_requests").select("id,conversation_id,title,description,status,proposed_amount,created_at").eq("client_id", client.id).order("created_at", { ascending: false }) : { data: [] };
  return <AppShell eyebrow="Cliente" title="Minhas solicitações"><div className="grid gap-4">{data?.length ? data.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold text-[#0F2D4E]">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.description}</p></div><span className="h-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0F2D4E]">{labels[item.status] ?? item.status}</span></div><Link href={`/marketplace/conversations/${item.conversation_id}`} className="mt-4 inline-block text-sm font-bold text-[#F2811D]">Abrir negociação →</Link></article>) : <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Nenhuma solicitação criada.</p>}</div></AppShell>;
}
