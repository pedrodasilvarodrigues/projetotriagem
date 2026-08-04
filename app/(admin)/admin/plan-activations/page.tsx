import { CheckCircle2, Clock3, Mail, Phone, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { activateCompanyPlanAction } from "@/lib/actions/company-plans";
import { companyPlanLabel } from "@/lib/companies/plans";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminPlanActivationsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; notification?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id,trade_name,legal_name,corporate_email,phone,plano,status_plano,plano_escolhido_em,city,state")
    .eq("status_plano", "pendente_ativacao")
    .in("plano", ["pro", "vip"])
    .is("deleted_at", null)
    .order("plano_escolhido_em", { ascending: true });

  return (
    <AppShell eyebrow="Administrador" title="Ativações de planos">
      <div className="space-y-5">
        {params.error ? <div className="plan-feedback is-error" role="alert"><strong>Ativação não concluída.</strong><span>{decodeURIComponent(params.error)}</span></div> : null}
        {params.message ? (
          <div className="plan-feedback is-success" role="status">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>Plano ativado. {params.notification === "email-enviado" ? "A empresa recebeu o aviso por e-mail." : "O acesso já está liberado para a empresa."}</span>
          </div>
        ) : null}

        <section className="admin-plan-intro">
          <div><ShieldCheck aria-hidden="true" size={22} /></div>
          <div>
            <span>Fila comercial</span>
            <h2>Empresas aguardando ativação</h2>
            <p>Confirme somente após a validação comercial. A ativação libera o painel imediatamente e registra o administrador responsável.</p>
          </div>
          <strong>{companies?.length ?? 0}</strong>
        </section>

        <section className="admin-plan-list" aria-label="Empresas com plano pendente">
          {(companies ?? []).map((company) => (
            <article key={company.id} className="admin-plan-row">
              <div className="admin-plan-company">
                <span className={`origin-badge ${company.plano === "vip" ? "is-interest" : "is-pending"}`}>{companyPlanLabel(company.plano)}</span>
                <h2>{company.trade_name}</h2>
                <p>{company.legal_name}</p>
                <small>{company.city}/{company.state}</small>
              </div>
              <div className="admin-plan-contact">
                <span><Mail aria-hidden="true" size={15} />{company.corporate_email ?? "E-mail não informado"}</span>
                <span><Phone aria-hidden="true" size={15} />{company.phone ?? "Telefone não informado"}</span>
              </div>
              <div className="admin-plan-date">
                <Clock3 aria-hidden="true" size={17} />
                <div><span>Escolhido em</span><strong>{company.plano_escolhido_em ? new Date(company.plano_escolhido_em).toLocaleString("pt-BR") : "Data não registrada"}</strong></div>
              </div>
              <form action={activateCompanyPlanAction}>
                <input type="hidden" name="companyId" value={company.id} />
                <button type="submit" className="plan-primary-button">Ativar plano</button>
              </form>
            </article>
          ))}
          {(companies ?? []).length === 0 ? (
            <div className="plan-admin-empty"><CheckCircle2 aria-hidden="true" size={28} /><h2>Fila em dia</h2><p>Nenhuma empresa aguarda ativação de Pro ou VIP.</p></div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
