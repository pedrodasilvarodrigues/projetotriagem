import { BriefcaseBusiness, CheckCircle2, Clock3, Scale, ShieldQuestion } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { ProfessionalHireResponse } from "@/components/hiring/hire-confirmation-controls";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

type Confirmation = {
  company_confirmed: boolean;
  professional_confirmed: boolean | null;
  confirmation_status: string;
  deadline_at: string | null;
};

type ProcessRow = {
  id: string;
  status: string;
  updated_at: string;
  demand: {
    title: string;
    city: string;
    state: string;
    company: { trade_name: string; legal_name: string } | { trade_name: string; legal_name: string }[] | null;
  } | {
    title: string;
    city: string;
    state: string;
    company: { trade_name: string; legal_name: string } | { trade_name: string; legal_name: string }[] | null;
  }[] | null;
  confirmation: Confirmation | Confirmation[] | null;
};

const feedbackMessages: Record<string, string> = {
  "contratacao-confirmada": "Contratação confirmada. O processo foi concluído oficialmente.",
  "divergencia-registrada": "Sua resposta foi registrada e o caso seguirá para análise do Admin.",
  "resposta-ja-registrada": "Sua resposta para esta contratação já foi registrada.",
  "prazo-de-confirmacao-encerrado": "O prazo terminou e o caso já foi encaminhado para análise.",
  "resposta-invalida": "Não foi possível identificar sua resposta.",
  "nao-foi-possivel-concluir": "Não foi possível registrar sua resposta agora. Tente novamente em instantes."
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfessionalScreeningStatusPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: professional } = await supabase.from("professionals").select("id").eq("user_id", userData.user?.id).maybeSingle();
  const { data: processes } = professional?.id
    ? await supabase
        .from("screening_processes")
        .select("id,status,updated_at,demand:demands(title,city,state,company:companies(trade_name,legal_name)),confirmation:hire_confirmations(company_confirmed,professional_confirmed,confirmation_status,deadline_at)")
        .eq("professional_id", professional.id)
        .order("updated_at", { ascending: false })
    : { data: [] };
  const rows = (processes ?? []) as unknown as ProcessRow[];
  const pendingConfirmations = rows.filter((process) => process.status === "awaiting_professional_confirmation" && one(process.confirmation)?.professional_confirmed == null);

  return (
    <AppShell eyebrow="Profissional" title="Situação da Triagem">
      <div className="space-y-5">
        {params.message ? <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><p>{feedbackMessages[params.message] ?? "Resposta registrada."}</p></div> : null}
        {params.error ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert"><Scale className="mt-0.5 shrink-0" size={18} /><p>{feedbackMessages[params.error] ?? feedbackMessages["nao-foi-possivel-concluir"]}</p></div> : null}

        {pendingConfirmations.length > 0 ? (
          <section className="overflow-hidden rounded-2xl border border-[#F2811D]/40 bg-white shadow-[0_16px_38px_rgba(15,45,78,.09)]">
            <div className="flex items-start gap-3 bg-[#0F2D4E] p-5 text-white sm:p-6">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F2811D] text-[#071522]"><ShieldQuestion aria-hidden="true" size={22} /></div>
              <div><p className="text-xs font-bold uppercase text-[#FFB36D]">Sua confirmação é necessária</p><h2 className="mt-1 font-display text-xl font-bold">Confirme o resultado da contratação</h2><p className="mt-2 text-sm leading-6 text-slate-200">O status só muda para Contratado quando sua resposta coincide com a informação da empresa.</p></div>
            </div>
            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
              {pendingConfirmations.map((process) => {
                const demand = one(process.demand);
                const company = one(demand?.company ?? null);
                const confirmation = one(process.confirmation);
                return (
                  <article key={process.id} className="rounded-2xl border border-slate-200 bg-[#FAFBFC] p-5">
                    <p className="text-xs font-bold uppercase text-[#A94708]">Confirmação de contratação</p>
                    <h3 className="mt-2 text-lg font-bold leading-7 text-[#0F2D4E]">Você foi contratado pela {company?.trade_name ?? company?.legal_name ?? "empresa"} para {demand?.title ?? "esta vaga"}?</h3>
                    {confirmation?.deadline_at ? <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><Clock3 aria-hidden="true" size={15} /> Responda até {new Date(confirmation.deadline_at).toLocaleDateString("pt-BR")}</p> : null}
                    <div className="mt-5"><ProfessionalHireResponse processId={process.id} /></div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,45,78,.07)] sm:p-6">
          <div className="mb-5"><p className="text-xs font-bold uppercase text-[#A94708]">Acompanhamento</p><h2 className="mt-1 font-display text-xl font-bold text-[#0F2D4E]">Seus processos</h2></div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Demanda</th><th>Empresa</th><th>Local</th><th>Situação</th><th>Atualização</th></tr></thead>
              <tbody>
                {rows.map((process) => {
                  const demand = one(process.demand);
                  const company = one(demand?.company ?? null);
                  return <tr key={process.id}><td><span className="inline-flex items-center gap-2 font-bold text-[#0F2D4E]"><BriefcaseBusiness size={15} />{demand?.title ?? "Demanda"}</span></td><td>{company?.trade_name ?? company?.legal_name ?? "Em validação"}</td><td>{demand?.city ?? "-"}/{demand?.state ?? "-"}</td><td>{statusLabel(process.status)}</td><td>{new Date(process.updated_at).toLocaleDateString("pt-BR")}</td></tr>;
                })}
                {rows.length === 0 ? <tr><td colSpan={5}>Nenhuma triagem em andamento.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
