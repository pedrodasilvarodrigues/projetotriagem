import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function ClientConversationsPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: client } = await supabase.from("client_profiles").select("id").eq("user_id", userData.user?.id).maybeSingle();
  const { data } = client ? await supabase.from("marketplace_conversations").select("id,status,last_message_at,created_at,service_provider_profiles(professional_title)").eq("requester_user_id", userData.user?.id).order("updated_at", { ascending: false }) : { data: [] };
  return <AppShell eyebrow="Cliente" title="Conversas de serviços"><div className="grid gap-3">{data?.length ? data.map((item) => <Link key={item.id} href={`/marketplace/conversations/${item.id}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[#0F2D4E]"><MessageSquare size={20} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[#0F2D4E]">{(item.service_provider_profiles as unknown as { professional_title?: string })?.professional_title ?? "Prestador"}</strong><small className="text-slate-500">{item.status === "open" ? "Conversa aberta" : "Conversa encerrada"} · {new Date(item.last_message_at ?? item.created_at).toLocaleString("pt-BR")}</small></span></Link>) : <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Você ainda não iniciou conversas.</p>}</div></AppShell>;
}
