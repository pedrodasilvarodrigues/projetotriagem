import Link from "next/link";
import { ArrowRight, Check, Clock3, Scale, ShieldCheck, UserRoundCheck } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { updateProcessStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

type Confirmation = {
  company_confirmed: boolean;
  company_confirmed_at: string | null;
  professional_confirmed: boolean | null;
  professional_confirmed_at: string | null;
  confirmation_status: string;
};

type ProcessRow = {
  id: string;
  status: string;
  company_result: string | null;
  created_at: string;
  professional: { full_name: string; desired_role: string } | { full_name: string; desired_role: string }[] | null;
  demand: { title: string; company: { trade_name: string } | { trade_name: string }[] | null } | { title: string; company: { trade_name: string } | { trade_name: string }[] | null }[] | null;
  confirmation: Confirmation | Confirmation[] | null;
};

const feedbackMessages: Record<string, string> = {
  "dados-invalidos": "Selecione uma etapa válida para o processo.",
  "use-o-fluxo-de-confirmacao-da-contratacao": "Este processo está no fluxo de contratação e não pode ser alterado manualmente.",
  "nao-foi-possivel-atualizar-o-processo": "Não foi possível atualizar o processo agora."
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function ConfirmationStatus({ confirmation }: { confirmation: Confirmation | undefined }) {
  if (!confirmation?.company_confirmed) return <span className="text-xs text-slate-500">A empresa ainda não informou contratação.</span>;
  return (
    <div className="space-y-1.5 text-xs">
      <p className="flex items-center gap-2 font-semibold text-[#0F2D4E]"><ShieldCheck className="text-[#F2811D]" size={14} /> Empresa: confirmou</p>
      <p className={`flex items-center gap-2 font-semibold ${confirmation.professional_confirmed === false ? "text-red-700" : "text-[#0F2D4E]"}`}>
        {confirmation.professional_confirmed === false ? <Scale size={14} /> : confirmation.professional_confirmed === true ? <Check size={14} /> : <Clock3 size={14} />}
        Profissional: {confirmation.professional_confirmed === true ? "confirmou" : confirmation.professional_confirmed === false ? "negou" : "aguardando"}
      </p>
    </div>
  );
}

export default async function AdminProcessesPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  let query = supabase
    .from("screening_processes")
    .select("id,status,company_result,created_at,professional:professionals(full_name,desired_role),demand:demands(title,company:companies(trade_name)),confirmation:hire_confirmations(company_confirmed,company_confirmed_at,professional_confirmed,professional_confirmed_at,confirmation_status)")
    .order("updated_at", { ascending: false })
    .limit(120);
  if (params.status) query = query.eq("status", params.status);
  const { data: processes } = await query;
  const rows = (processes ?? []) as unknown as ProcessRow[];
  const managedStatuses = ["awaiting_professional_confirmation", "hire_dispute", "hired"];

  return (
    <AppShell eyebrow="Administrador" title="Processos">
      <div className="space-y-5">
        {params.error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">{feedbackMessages[params.error] ?? "Não foi possível concluir a atualização."}</div> : null}
        {params.message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">Processo atualizado.</div> : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,45,78,.06)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase text-[#A94708]">Fluxo operacional</p><h2 className="mt-1 font-display text-lg font-bold text-[#0F2D4E]">O Admin aprova; empresa e profissional confirmam a contratação</h2></div>
            <Link href="/admin/hiring-disputes" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#173D65]"><Scale size={17} /> Abrir disputas</Link>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {["Demanda", "Triagem", "Apresentação", "Aprovação", "Confirmação cruzada", "Contratação"].map((item, index) => <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-[#0F2D4E]"><span className="mr-2 text-[#A94708]">{index + 1}</span>{item}</div>)}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,45,78,.06)]">
          <form className="grid gap-3 md:grid-cols-[260px_auto]" action="/admin/processes">
            <select name="status" defaultValue={params.status ?? ""} className="field-input"><option value="">Todas as situações</option><option value="screening">Triagem</option><option value="analysis">Em análise</option><option value="forwarded">Apresentado</option><option value="interview">Entrevista</option><option value="pre_approved">Aprovado</option><option value="awaiting_professional_confirmation">Aguardando profissional</option><option value="hire_dispute">Divergência</option><option value="rejected">Reprovado</option><option value="hired">Contratado</option><option value="waiting">Encerrado</option></select>
            <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0F2D4E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#173D65]">Filtrar</button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,45,78,.06)]">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Profissional</th><th>Demanda</th><th>Etapa</th><th>Confirmações</th><th>Atualizar</th></tr></thead>
              <tbody>
                {rows.map((process) => {
                  const professional = one(process.professional);
                  const demand = one(process.demand);
                  const company = one(demand?.company ?? null);
                  const confirmation = one(process.confirmation) ?? undefined;
                  const managed = managedStatuses.includes(process.status);
                  return (
                    <tr key={process.id}>
                      <td><strong className="text-[#0F2D4E]">{professional?.full_name}</strong><p className="text-xs text-slate-500">{professional?.desired_role}</p></td>
                      <td>{demand?.title}<p className="text-xs text-slate-500">{company?.trade_name}</p></td>
                      <td><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-[#0F2D4E]">{statusLabel(process.status)}</span></td>
                      <td><ConfirmationStatus confirmation={confirmation} /></td>
                      <td>
                        {managed ? (
                          <div className="max-w-52 text-xs leading-5 text-slate-600">
                            <p>{process.status === "hire_dispute" ? "Aguardando decisão excepcional na fila de disputas." : process.status === "hired" ? "Contratação concluída pelas duas partes." : "Aguardando a resposta do profissional."}</p>
                            {process.status === "hire_dispute" ? <Link href="/admin/hiring-disputes" className="mt-2 inline-flex items-center gap-1 font-bold text-[#A94708] hover:underline">Analisar caso <ArrowRight size={13} /></Link> : null}
                          </div>
                        ) : (
                          <form action={updateProcessStatusAction} className="grid min-w-44 gap-2">
                            <input type="hidden" name="processId" value={process.id} />
                            <input type="hidden" name="redirectTo" value="/admin/processes" />
                            <select name="status" defaultValue={process.status} className="field-input text-xs">
                              <option value="screening">Triagem</option>
                              <option value="analysis">Em análise</option>
                              <option value="forwarded">Apresentado</option>
                              <option value="interview">Entrevista</option>
                              <option value="pre_approved">Aprovado</option>
                              <option value="rejected">Reprovado</option>
                              <option value="waiting">Encerrado</option>
                            </select>
                            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0F2D4E] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#173D65]"><UserRoundCheck size={15} /> Salvar etapa</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? <tr><td colSpan={5}>Nenhum processo encontrado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
