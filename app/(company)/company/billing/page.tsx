import Link from "next/link";
import { CheckCircle2, CreditCard, MessageCircle, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { companyPlanContactHref, companyPlanDefinition } from "@/lib/companies/plan-catalog";
import { requireActiveCompanyPlan } from "@/lib/companies/plan-access";

export default async function CompanyBillingPage() {
  const company = await requireActiveCompanyPlan();
  const plan = companyPlanDefinition(company.plano);
  const contactPlan = company.plano === "vip" ? "vip" : "pro";
  const contactHref = companyPlanContactHref({ companyName: company.trade_name, plan: contactPlan });

  return (
    <AppShell eyebrow="Empresa" title="Faturamento">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="plan-selection-card">
          <div className="plan-card-heading">
            <span className="plan-card-icon"><CreditCard aria-hidden="true" size={22} /></span>
            <div><p>Plano atual</p><h2>{plan?.name ?? company.plano}</h2></div>
          </div>
          <div className="plan-price-block">
            <strong>{plan?.monthlyPrice}</strong>
            <span>mensalidade</span>
            <small>{plan?.hiringFee}</small>
          </div>
          <ul>
            {plan?.benefits.map((benefit) => <li key={benefit}><CheckCircle2 aria-hidden="true" size={17} />{benefit}</li>)}
          </ul>
          <div className="plan-feedback is-success"><ShieldCheck aria-hidden="true" size={18} /><span>Plano ativo e acesso empresarial liberado.</span></div>
        </section>

        <aside className="plan-selection-card">
          <span className="plan-card-icon"><MessageCircle aria-hidden="true" size={22} /></span>
          <h2 className="mt-5 font-display text-xl font-bold text-[#0F2D4E]">Precisa alterar o plano?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Mudanças de plano são acompanhadas pela equipe para manter contrato, taxa e acesso alinhados.</p>
          <Link href={contactHref} target={contactHref.startsWith("http") ? "_blank" : undefined} className="plan-primary-button mt-6">
            Falar sobre meu plano
          </Link>
          <p className="mt-4 text-xs leading-6 text-slate-500">A tela obrigatória de escolha não volta a aparecer depois da ativação.</p>
        </aside>
      </div>
    </AppShell>
  );
}
