import Link from "next/link";
import { Archive, ArrowRight, Check, Clock3, FileText, Inbox, Scale, ShieldCheck, UserRoundCheck } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { CandidateVisibilityControls } from "@/components/hiring/candidate-visibility-controls";
import { CompanyHireButton } from "@/components/hiring/hire-confirmation-controls";
import { createServerClient } from "@/lib/supabase/server";

type Candidate = {
  id: string;
  full_name: string;
};

type Demand = {
  id: string;
  name: string | null;
  title: string;
};

type HireConfirmation = {
  company_confirmed: boolean;
  professional_confirmed: boolean | null;
  confirmation_status: string;
  deadline_at: string | null;
};

type CandidateProcess = {
  id: string;
  status: string;
  candidate_origin: "curadoria" | "interesse_empresa";
  company_visibility: "active" | "archived";
  updated_at: string;
  professional: Candidate | Candidate[] | null;
  demand: Demand | Demand[] | null;
  confirmation: HireConfirmation | HireConfirmation[] | null;
};

const feedbackMessages: Record<string, string> = {
  "contratacao-enviada": "Confirmação enviada ao profissional. A contratação será oficial quando ele responder.",
  "candidato-ainda-nao-aprovado": "A contratação só pode ser informada depois que o Admin aprovar o candidato.",
  "contratacao-ja-informada": "Esta contratação já foi informada e aguarda a resposta do profissional.",
  "processo-invalido": "Não foi possível identificar este processo.",
  "acesso-nao-autorizado": "Este processo não pertence à sua empresa.",
  "curriculo-indisponivel": "Este currículo ainda não foi liberado para análise.",
  "candidato-arquivado": "Candidato arquivado. Ele saiu da lista principal, mas seu histórico permanece disponível.",
  "candidato-restaurado": "Candidato restaurado para a lista principal.",
  "candidato-removido": "Candidato excluído da sua lista. O histórico administrativo foi preservado.",
  "candidato-ainda-em-andamento": "Somente candidatos contratados ou reprovados podem ser arquivados ou excluídos.",
  "candidato-ja-removido": "Este candidato já foi excluído da lista.",
  "nao-foi-possivel-concluir": "Não foi possível registrar a confirmação agora. Tente novamente em instantes."
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function processStatus(status: string) {
  const labels: Record<string, { label: string; tone: string }> = {
    forwarded: { label: "Apresentado", tone: "bg-blue-50 text-[#0F2D4E]" },
    interview: { label: "Em entrevista", tone: "bg-amber-50 text-amber-900" },
    pre_approved: { label: "Aprovado pelo Admin", tone: "bg-emerald-50 text-emerald-800" },
    awaiting_professional_confirmation: { label: "Aguardando profissional", tone: "bg-orange-50 text-orange-900" },
    hire_dispute: { label: "Em análise de divergência", tone: "bg-red-50 text-red-800" },
    hired: { label: "Contratado", tone: "bg-emerald-100 text-emerald-900" },
    rejected: { label: "Não selecionado", tone: "bg-slate-100 text-slate-700" }
  };
  return labels[status] ?? { label: "Em análise", tone: "bg-slate-100 text-slate-700" };
}

function ConfirmationTrail({ process, confirmation }: { process: CandidateProcess; confirmation: HireConfirmation | undefined }) {
  const companyDone = Boolean(confirmation?.company_confirmed) || ["awaiting_professional_confirmation", "hire_dispute", "hired"].includes(process.status);
  const professionalDone = confirmation?.professional_confirmed === true || process.status === "hired";
  const disputed = confirmation?.professional_confirmed === false || process.status === "hire_dispute";

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2" aria-label="Etapas da confirmação da contratação">
      <div className={`rounded-xl border px-3 py-2 ${companyDone ? "border-[#F2811D]/40 bg-orange-50" : "border-slate-200 bg-slate-50"}`}>
        <span className="flex items-center gap-2 text-xs font-bold text-[#0F2D4E]"><Check size={14} /> Empresa</span>
        <small className="mt-1 block text-[11px] text-slate-600">{companyDone ? "Confirmou" : "Ainda não informou"}</small>
      </div>
      <ArrowRight aria-hidden="true" className="text-slate-400" size={16} />
      <div className={`rounded-xl border px-3 py-2 ${professionalDone ? "border-emerald-200 bg-emerald-50" : disputed ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
        <span className="flex items-center gap-2 text-xs font-bold text-[#0F2D4E]">{disputed ? <Scale size={14} /> : <UserRoundCheck size={14} />} Profissional</span>
        <small className="mt-1 block text-[11px] text-slate-600">{professionalDone ? "Confirmou" : disputed ? "Resposta divergente" : companyDone ? "Aguardando resposta" : "Etapa seguinte"}</small>
      </div>
    </div>
  );
}

export default async function CompanyCandidatesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; view?: string }>;
}) {
  const params = await searchParams;
  const currentView = params.view === "archived" ? "archived" : "active";
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", userData.user?.id).maybeSingle();
  const { data: candidateProcesses } = company?.id
    ? await supabase
        .from("screening_processes")
        .select("id,status,candidate_origin,company_visibility,updated_at,demand:demands!inner(id,name,title,company_id),professional:professionals!inner(id,full_name),confirmation:hire_confirmations(company_confirmed,professional_confirmed,confirmation_status,deadline_at)")
        .eq("demand.company_id", company.id)
        .in("status", ["forwarded", "interview", "pre_approved", "awaiting_professional_confirmation", "hire_dispute", "hired", "rejected"])
        .in("company_visibility", ["active", "archived"])
        .order("updated_at", { ascending: false })
    : { data: [] };

  const allProcesses = (candidateProcesses ?? []) as unknown as CandidateProcess[];
  const activeProcesses = allProcesses.filter((process) => process.company_visibility === "active");
  const archivedProcesses = allProcesses.filter((process) => process.company_visibility === "archived");
  const processes = currentView === "archived" ? archivedProcesses : activeProcesses;

  return (
    <AppShell eyebrow="Empresa" title="Candidatos apresentados">
      <div className="space-y-5">
        {params.message ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
            <p>{feedbackMessages[params.message] ?? "Informação registrada com sucesso."}</p>
          </div>
        ) : null}
        {params.error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
            <Scale aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
            <p>{feedbackMessages[params.error] ?? feedbackMessages["nao-foi-possivel-concluir"]}</p>
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,45,78,.07)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase text-[#A94708]">{currentView === "archived" ? "Histórico organizado" : "Decisão da empresa"}</p>
              <h2 className="mt-1 font-display text-xl font-bold text-[#0F2D4E]">{currentView === "archived" ? "Candidatos arquivados" : "Analise o currículo antes de avançar"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {currentView === "archived"
                  ? "Consulte candidatos encerrados e restaure aqueles que precisam voltar à lista principal."
                  : "Dados de contato permanecem protegidos. Candidatos contratados ou reprovados podem ser arquivados para manter esta lista objetiva."}
              </p>
            </div>
            <span className="rounded-full bg-[#0F2D4E] px-3 py-1.5 text-xs font-bold text-white">{processes.length} candidato{processes.length === 1 ? "" : "s"}</span>
          </div>

          <nav className="mt-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-1" aria-label="Visualização dos candidatos">
            <Link
              href="/company/candidates"
              aria-current={currentView === "active" ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] ${currentView === "active" ? "bg-white text-[#0F2D4E] shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-[#0F2D4E]"}`}
            >
              <Inbox aria-hidden="true" size={16} /> Ativos <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{activeProcesses.length}</span>
            </Link>
            <Link
              href="/company/candidates?view=archived"
              aria-current={currentView === "archived" ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] ${currentView === "archived" ? "bg-white text-[#0F2D4E] shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-[#0F2D4E]"}`}
            >
              <Archive aria-hidden="true" size={16} /> Arquivados <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{archivedProcesses.length}</span>
            </Link>
          </nav>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {processes.map((process) => {
              const candidate = one(process.professional);
              const demand = one(process.demand);
              const confirmation = one(process.confirmation) ?? undefined;
              if (!candidate || !demand) return null;
              const status = processStatus(process.status);

              return (
                <article key={process.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-[#FAFBFC] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#F2811D]/45 hover:shadow-[0_14px_30px_rgba(15,45,78,.09)] sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold text-[#0F2D4E]">{candidate.full_name}</p>
                      <p className="mt-1 text-sm text-slate-600">{demand.name ?? demand.title}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tone}`}>{status.label}</span>
                  </div>

                  <div className="mt-4">
                    <ConfirmationTrail process={process} confirmation={confirmation} />
                  </div>

                  {confirmation?.deadline_at && process.status === "awaiting_professional_confirmation" ? (
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-600"><Clock3 aria-hidden="true" size={14} /> Resposta até {new Date(confirmation.deadline_at).toLocaleDateString("pt-BR")}</p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                    <Link
                      href={`/company/candidates/${process.id}/resume`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#0F2D4E]/20 bg-white px-4 py-2.5 text-sm font-bold text-[#0F2D4E] transition hover:border-[#F2811D] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] focus-visible:ring-offset-2"
                    >
                      <FileText aria-hidden="true" size={17} /> Ver currículo
                    </Link>
                    {process.status === "pre_approved" && !confirmation?.company_confirmed ? <CompanyHireButton processId={process.id} /> : null}
                  </div>

                  {process.status === "hired" || process.status === "rejected" ? (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <CandidateVisibilityControls processId={process.id} currentView={currentView} />
                    </div>
                  ) : null}

                  <span className={`origin-badge mt-4 w-fit ${process.candidate_origin === "interesse_empresa" ? "is-interest" : "is-curation"}`}>
                    {process.candidate_origin === "interesse_empresa" ? "Você demonstrou interesse" : "Apresentado pela curadoria"}
                  </span>
                </article>
              );
            })}

            {processes.length === 0 ? (
              <div className="col-span-full grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div>
                  {currentView === "archived" ? <Archive className="mx-auto text-[#F2811D]" size={30} /> : <UserRoundCheck className="mx-auto text-[#F2811D]" size={30} />}
                  <h2 className="mt-3 font-display text-lg font-bold text-[#0F2D4E]">{currentView === "archived" ? "Nenhum candidato arquivado" : "Nenhum candidato apresentado"}</h2>
                  <p className="mt-1 text-sm text-slate-600">{currentView === "archived" ? "Os candidatos que você arquivar aparecerão aqui." : "Os profissionais liberados pelo Admin aparecerão aqui."}</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
