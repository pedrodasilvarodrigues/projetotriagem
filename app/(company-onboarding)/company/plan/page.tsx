import { redirect } from "next/navigation";
import { Check, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { PortalEncaixeLogo } from "@/components/app/logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { chooseCompanyPlanAction } from "@/lib/actions/company-plans";
import { signOutAction } from "@/lib/actions/auth";
import { companyPlans } from "@/lib/companies/plan-catalog";
import { getCurrentCompanyPlanAccess } from "@/lib/companies/plan-access";

const icons = {
  essencial: ShieldCheck,
  pro: Sparkles,
  vip: Crown
};

export default async function CompanyPlanPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const company = await getCurrentCompanyPlanAccess();
  if (!company) redirect("/onboarding/company");
  if (company.status_plano === "ativo") redirect("/company");
  if (company.status_plano === "pendente_ativacao") redirect("/company/plan/pending");

  return (
    <main className="plan-onboarding-shell">
      <header className="plan-onboarding-header">
        <PortalEncaixeLogo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={signOutAction}>
            <button type="submit" className="plan-quiet-button">Sair</button>
          </form>
        </div>
      </header>

      <section className="plan-onboarding-intro">
        <span>Etapa final do cadastro</span>
        <h1>Escolha como sua empresa quer avançar.</h1>
        <p>
          Olá, {company.trade_name}. Seu cadastro está concluído. Agora selecione o plano que define a experiência da sua equipe no Portal Encaixe.
        </p>
      </section>

      {params.error ? (
        <div className="plan-feedback is-error" role="alert">
          <strong>Não foi possível concluir a escolha.</strong>
          <span>{decodeURIComponent(params.error)}</span>
        </div>
      ) : null}

      <section className="plan-selection-grid" aria-label="Planos empresariais">
        {companyPlans.map((plan) => {
          const Icon = icons[plan.id];
          return (
            <article key={plan.id} className={`plan-selection-card ${plan.featured ? "is-featured" : ""}`}>
              {plan.featured ? <span className="plan-featured-badge">Mais escolhido</span> : null}
              <div className="plan-card-heading">
                <span className="plan-card-icon"><Icon aria-hidden="true" size={22} /></span>
                <div>
                  <p>Plano</p>
                  <h2>{plan.name}</h2>
                </div>
              </div>
              <p className="plan-card-description">{plan.description}</p>
              <div className="plan-price-block">
                <strong>{plan.monthlyPrice}</strong>
                <span>{plan.id === "essencial" ? "por mês" : "mensalidade"}</span>
                <small>{plan.hiringFee}</small>
              </div>
              <ul>
                {plan.benefits.map((benefit) => (
                  <li key={benefit}><Check aria-hidden="true" size={17} />{benefit}</li>
                ))}
              </ul>
              <form action={chooseCompanyPlanAction}>
                <input type="hidden" name="plan" value={plan.id} />
                <button type="submit" className="plan-primary-button">
                  Escolher {plan.id === "vip" ? "VIP" : plan.name}
                </button>
              </form>
            </article>
          );
        })}
      </section>

      <p className="plan-onboarding-note">
        O Essencial é liberado imediatamente. Pro e VIP passam por uma ativação assistida, sem cobrança automática nesta etapa.
      </p>
    </main>
  );
}
