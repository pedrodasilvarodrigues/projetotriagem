import Link from "next/link";
import { Check, CircleDollarSign, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { companyPlanContactHref, companyPlans } from "@/lib/companies/plan-catalog";
import { requireActiveCompanyPlan } from "@/lib/companies/plan-access";

const commercialConditions = {
  essencial: { monthly: "R$ 0/mês", fee: "R$ 99 por contratação" },
  pro: { monthly: "R$ 199/mês", fee: "R$ 299 por contratação" },
  vip: { monthly: "R$ 299/mês", fee: "R$ 199 (ou R$ 149) por contratação" }
} as const;

export default async function CompanyPlansPage() {
  const company = await requireActiveCompanyPlan();
  return <AppShell eyebrow="Empresa" title="Planos e condições"><div className="space-y-6 pb-8">
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0F2D4E] px-5 py-8 text-white shadow-[0_20px_50px_rgba(15,45,78,.2)] sm:px-8"><div className="pointer-events-none absolute -right-14 -top-16 size-60 rounded-full border-[28px] border-[#F2811D]/20" /><div className="relative flex flex-wrap items-end justify-between gap-5"><div className="max-w-2xl"><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#FFB36D]"><Sparkles size={15} />Planos empresariais</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Contrate no ritmo da sua empresa.</h2><p className="mt-3 text-sm leading-6 text-slate-200">Compare as condições e solicite a mudança que faz sentido para sua operação.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3"><p className="text-xs font-semibold uppercase text-slate-300">Plano atual</p><p className="mt-1 flex items-center gap-2 text-xl font-bold"><Crown className="text-[#F2811D]" size={19} />{companyPlans.find((plan) => plan.id === company.plano)?.name}</p></div></div></section>
    <section className="grid gap-5 lg:grid-cols-3">{companyPlans.map((plan) => { const current = plan.id === company.plano; const price = commercialConditions[plan.id]; const href = current ? "/company/billing" : companyPlanContactHref({ companyName: company.trade_name, plan: plan.id }); return <article key={plan.id} className={`relative flex flex-col overflow-hidden rounded-[1.5rem] border bg-white p-6 shadow-[0_12px_28px_rgba(15,45,78,.08)] ${plan.featured ? "border-[#F2811D] ring-1 ring-[#F2811D]/35" : "border-slate-200"}`}><p className="text-xs font-bold uppercase tracking-[.14em] text-[#F2811D]">{plan.featured ? "Mais escolhido" : "Plano empresarial"}</p><h3 className="mt-2 font-display text-2xl font-bold text-[#0F2D4E]">{plan.name}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p><div className="mt-6 border-y border-slate-100 py-5"><p className="font-display text-3xl font-bold text-[#0F2D4E]">{price.monthly}</p><p className="mt-3 flex gap-2 text-sm text-slate-600"><CircleDollarSign className="shrink-0 text-[#F2811D]" size={18} />{price.fee}</p></div><ul className="mt-5 space-y-3 text-sm text-slate-700">{plan.benefits.map((item) => <li key={item} className="flex gap-2"><Check className="shrink-0 text-[#F2811D]" size={17} />{item}</li>)}</ul><Link href={href} target={href.startsWith("http") ? "_blank" : undefined} className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-bold ${current ? "border border-[#0F2D4E]/15 bg-[#0F2D4E]/5 text-[#0F2D4E]" : "bg-[#0F2D4E] text-white transition hover:-translate-y-0.5 hover:bg-[#173d65]"}`}>{current ? "Plano atual" : "Solicitar mudança"}</Link></article>; })}</section>
    <section className="flex gap-3 rounded-2xl bg-[#0F2D4E] p-5 text-sm leading-6 text-slate-200"><ShieldCheck className="shrink-0 text-[#F2811D]" size={22} />A equipe comercial confirma as condições de mudança antes de ativar planos Pro ou VIP, preservando contrato, taxas e acesso da empresa.</section>
  </div></AppShell>;
}
