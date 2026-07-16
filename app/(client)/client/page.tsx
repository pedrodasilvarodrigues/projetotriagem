import Link from "next/link";
import { ClipboardCheck, MessageSquare, Search, UserRoundCog } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { saveClientProfileAction } from "@/lib/actions/marketplace";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const input = "mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-[#F2811D]";

export default async function ClientPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("client_profiles").select("*").eq("user_id", userData.user?.id).maybeSingle();
  const [{ count: conversations }, { count: requests }] = profile ? await Promise.all([
    supabase.from("marketplace_conversations").select("id", { count: "exact", head: true }).eq("client_id", profile.id),
    supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("client_id", profile.id)
  ]) : [{ count: 0 }, { count: 0 }];
  return <AppShell eyebrow="Cliente" title="Encontre o serviço certo">
    {params.error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(params.error)}</p>}
    <section className="mb-6 rounded-2xl bg-[#0F2D4E] p-6 text-white"><p className="text-xs font-bold uppercase tracking-wide text-orange-300">Marketplace Encaixe</p><h2 className="mt-2 text-2xl font-bold">Negocie diretamente com prestadores aprovados</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Converse, formalize uma solicitação e avalie somente depois da conclusão confirmada.</p><Link href="/services" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F2811D] px-5 py-3 font-bold text-white"><Search size={18} />Buscar prestadores</Link></section>
    <div className="grid gap-5 md:grid-cols-3"><Link href="/client/conversations" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><MessageSquare className="text-[#F2811D]" /><strong className="mt-3 block text-2xl text-[#0F2D4E]">{conversations ?? 0}</strong><span className="text-sm text-slate-500">Conversas</span></Link><Link href="/client/requests" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><ClipboardCheck className="text-[#F2811D]" /><strong className="mt-3 block text-2xl text-[#0F2D4E]">{requests ?? 0}</strong><span className="text-sm text-slate-500">Solicitações</span></Link><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><UserRoundCog className="text-[#F2811D]" /><strong className="mt-3 block text-lg text-[#0F2D4E]">Contato protegido</strong><span className="text-sm text-slate-500">Negociação dentro da plataforma</span></div></div>
    <form action={saveClientProfileAction} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-[#0F2D4E]">Minha localização</h2><p className="mt-1 text-sm text-slate-500">Usada para encontrar prestadores próximos. A localização exata não é exibida.</p><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">Cidade<input name="city" required className={input} defaultValue={profile?.city ?? ""} /></label><label className="text-sm font-semibold">UF<input name="state" required maxLength={2} className={input} defaultValue={profile?.state ?? ""} /></label><label className="text-sm font-semibold">Região ou bairro<input name="regionName" className={input} defaultValue={profile?.region_name ?? ""} /></label></div><button className="mt-4 rounded-xl bg-[#0F2D4E] px-5 py-3 text-sm font-bold text-white">Salvar localização</button></form>
  </AppShell>;
}
