import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, MessageCircle, RefreshCw } from "lucide-react";
import { PortalEncaixeLogo } from "@/components/app/logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { PlanStatusRefresh } from "@/components/company/plan-status-refresh";
import { signOutAction } from "@/lib/actions/auth";
import { companyPlanContactHref, companyPlanDefinition, type SelectableCompanyPlan } from "@/lib/companies/plan-catalog";
import { getCurrentCompanyPlanAccess } from "@/lib/companies/plan-access";

export default async function PendingCompanyPlanPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const company = await getCurrentCompanyPlanAccess();
  if (!company) redirect("/onboarding/company");
  if (company.status_plano === "ativo") redirect("/company?message=plano-ativado");
  if (company.status_plano !== "pendente_ativacao" || !["pro", "vip"].includes(company.plano)) redirect("/company/plan");

  const plan = companyPlanDefinition(company.plano);
  const contactHref = companyPlanContactHref({ companyName: company.trade_name, plan: company.plano as SelectableCompanyPlan });

  return (
    <main className="plan-onboarding-shell plan-pending-shell">
      <PlanStatusRefresh />
      <header className="plan-onboarding-header">
        <PortalEncaixeLogo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={signOutAction}><button type="submit" className="plan-quiet-button">Sair</button></form>
        </div>
      </header>

      <section className="plan-pending-card">
        <div className="plan-pending-icon"><Clock3 aria-hidden="true" size={32} /></div>
        <span className="plan-pending-kicker">Plano {plan?.name}</span>
        <h1>Sua ativação já está em andamento.</h1>
        <p>
          Recebemos a escolha da {company.trade_name}. A equipe do Portal Encaixe fará a confirmação comercial e liberará o painel assim que a ativação for concluída.
        </p>

        {params.message ? (
          <div className="plan-feedback is-success" role="status">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>Solicitação registrada com sucesso.</span>
          </div>
        ) : null}

        <div className="plan-pending-status">
          <span><i /> Aguardando confirmação da equipe</span>
          <small>Esta página verifica a liberação automaticamente.</small>
        </div>

        <div className="plan-pending-actions">
          <Link href={contactHref} className="plan-primary-button" target={contactHref.startsWith("http") ? "_blank" : undefined}>
            <MessageCircle aria-hidden="true" size={18} /> Falar com a equipe
          </Link>
          <Link href="/company/plan/pending" className="plan-secondary-button">
            <RefreshCw aria-hidden="true" size={17} /> Verificar agora
          </Link>
        </div>
      </section>
    </main>
  );
}
