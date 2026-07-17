import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfessionalServiceConversationsPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: professional } = await supabase.from("professionals").select("id").eq("user_id", userData.user?.id).maybeSingle();
  const { data: provider } = professional ? await supabase.from("service_provider_profiles").select("id").eq("professional_id", professional.id).maybeSingle() : { data: null };
  const filters = [`requester_user_id.eq.${userData.user?.id}`];
  if (provider?.id) filters.push(`provider_id.eq.${provider.id}`);
  const { data: conversations } = userData.user ? await supabase.from("marketplace_conversations").select("id,status,requester_user_id,last_message_at,created_at,service_provider_profiles(professional_title)").or(filters.join(",")).order("updated_at", { ascending: false }) : { data: [] };
  return <AppShell eyebrow="Profissional" title="Conversas de serviços"><div className="grid gap-3">{conversations?.length ? conversations.map((item) => { const relation = item.service_provider_profiles as unknown as { professional_title?: string } | null; const direction = item.requester_user_id === userData.user?.id ? "Você solicitou" : "Cliente interessado"; return <Link key={item.id} href={`/marketplace/conversations/${item.id}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[#0F2D4E]"><MessageSquare size={20} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[#0F2D4E]">{direction}: {relation?.professional_title ?? "serviço"}</strong><small className="text-slate-500">{item.status === "open" ? "Conversa aberta" : "Conversa encerrada"} · {new Date(item.last_message_at ?? item.created_at).toLocaleString("pt-BR")}</small></span></Link>; }) : <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Nenhuma conversa de serviço iniciada.</p>}</div></AppShell>;
}
