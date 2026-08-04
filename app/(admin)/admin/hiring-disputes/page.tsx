import { AlertTriangle, CheckCircle2, Clock3, Scale, ShieldCheck, UserRoundCheck } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { adminResolveHireDisputeAction } from "@/lib/actions/hiring";
import { createServerClient } from "@/lib/supabase/server";

type DisputeRow = {
  id: string;
  confirmation_status: string;
  company_confirmed: boolean;
  company_confirmed_at: string | null;
  professional_confirmed: boolean | null;
  professional_confirmed_at: string | null;
  deadline_at: string | null;
  dispute_reason: string | null;
  process: {
    id: string;
    professional: { full_name: string } | { full_name: string }[] | null;
    demand: {
      title: string;
      company: { trade_name: string; legal_name: string } | { trade_name: string; legal_name: string }[] | null;
    } | {
      title: string;
      company: { trade_name: string; legal_name: string } | { trade_name: string; legal_name: string }[] | null;
    }[] | null;
  } | {
    id: string;
    professional: { full_name: string } | { full_name: string }[] | null;
    demand: {
      title: string;
      company: { trade_name: string; legal_name: string } | { trade_name: string; legal_name: string }[] | null;
    } | {
      title: string;
      company: { trade_name: string; legal_name: string } | { trade_name: string; legal_name: string }[] | null;
    }[] | null;
  }[] | null;
};

const feedbackMessages: Record<string, string> = {
  "disputa-resolvida": "Divergência resolvida e processo atualizado.",
  "preencha-a-justificativa": "Informe uma justificativa com pelo menos 5 caracteres.",
  "disputa-ja-resolvida": "Esta divergência já foi resolvida.",
  "nao-foi-possivel-concluir": "Não foi possível concluir a análise agora."
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function responseLabel(value: boolean | null, company = false) {
  if (value === true) return company ? "Informou a contratação" : "Confirmou a contratação";
  if (value === false) return "Negou a contratação";
  return "Não respondeu";
}

export default async function AdminHiringDisputesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("hire_confirmations")
    .select("id,confirmation_status,company_confirmed,company_confirmed_at,professional_confirmed,professional_confirmed_at,deadline_at,dispute_reason,process:screening_processes!inner(id,professional:professionals(full_name),demand:demands(title,company:companies(trade_name,legal_name)))")
    .in("confirmation_status", ["disputed", "expired_no_response"])
    .order("updated_at", { ascending: true });
  const disputes = (data ?? []) as unknown as DisputeRow[];

  return (
    <AppShell eyebrow="Administrador" title="Disputas de contratação">
      <div className="space-y-5">
        {params.message ? <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><p>{feedbackMessages[params.message] ?? "Análise concluída."}</p></div> : null}
        {params.error ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><p>{feedbackMessages[params.error] ?? feedbackMessages["nao-foi-possivel-concluir"]}</p></div> : null}

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#0F2D4E] p-5 text-white shadow-[0_16px_38px_rgba(15,45,78,.18)] sm:p-6">
          <div className="flex max-w-3xl items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F2811D] text-[#071522]"><Scale size={22} /></div><div><p className="text-xs font-bold uppercase text-[#FFB36D]">Exceções do fluxo</p><h2 className="mt-1 font-display text-xl font-bold">O Admin só decide quando existe divergência</h2><p className="mt-2 text-sm leading-6 text-slate-200">Analise a confirmação da empresa e a resposta do profissional. Toda decisão fica auditada e só gera cobrança quando o resultado final for Contratado.</p></div></div>
          <strong className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">{disputes.length} pendente{disputes.length === 1 ? "" : "s"}</strong>
        </section>

        <section className="grid gap-4 xl:grid-cols-2" aria-label="Casos com divergência de contratação">
          {disputes.map((item) => {
            const process = one(item.process);
            const professional = one(process?.professional ?? null);
            const demand = one(process?.demand ?? null);
            const company = one(demand?.company ?? null);
            const noResponse = item.confirmation_status === "expired_no_response";

            return (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,45,78,.07)] sm:p-6">
                <div className="flex items-start justify-between gap-3"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${noResponse ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-800"}`}>{noResponse ? "Prazo encerrado" : "Respostas divergentes"}</span><h2 className="mt-3 font-display text-lg font-bold text-[#0F2D4E]">{professional?.full_name ?? "Profissional"}</h2><p className="mt-1 text-sm text-slate-600">{company?.trade_name ?? company?.legal_name ?? "Empresa"} · {demand?.title ?? "Vaga"}</p></div><Scale className="shrink-0 text-[#F2811D]" size={22} /></div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-3"><span className="flex items-center gap-2 text-xs font-bold text-[#0F2D4E]"><ShieldCheck size={15} /> Empresa</span><p className="mt-1 text-sm text-slate-700">{responseLabel(item.company_confirmed, true)}</p><small className="mt-1 block text-xs text-slate-500">{item.company_confirmed_at ? new Date(item.company_confirmed_at).toLocaleString("pt-BR") : "Sem registro"}</small></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="flex items-center gap-2 text-xs font-bold text-[#0F2D4E]"><UserRoundCheck size={15} /> Profissional</span><p className="mt-1 text-sm text-slate-700">{responseLabel(item.professional_confirmed)}</p><small className="mt-1 block text-xs text-slate-500">{item.professional_confirmed_at ? new Date(item.professional_confirmed_at).toLocaleString("pt-BR") : "Sem resposta no prazo"}</small></div>
                </div>

                {item.deadline_at ? <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Clock3 size={14} /> Prazo original: {new Date(item.deadline_at).toLocaleString("pt-BR")}</p> : null}

                <form action={adminResolveHireDisputeAction} className="mt-5 border-t border-slate-100 pt-5">
                  <input type="hidden" name="confirmationId" value={item.id} />
                  <label className="text-xs font-bold uppercase text-slate-600" htmlFor={`note-${item.id}`}>Justificativa da decisão</label>
                  <textarea id={`note-${item.id}`} name="note" required minLength={5} maxLength={1200} className="field-input mt-2 min-h-24" placeholder="Registre os fatos verificados antes de encerrar o caso." />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button name="resolution" value="hired" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0F2D4E] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#173D65] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] focus-visible:ring-offset-2"><CheckCircle2 size={17} /> Resolver como contratado</button>
                    <button name="resolution" value="not_hired" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#0F2D4E] transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Resolver como não contratado</button>
                  </div>
                </form>
              </article>
            );
          })}

          {disputes.length === 0 ? <div className="col-span-full grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><CheckCircle2 className="mx-auto text-emerald-600" size={32} /><h2 className="mt-3 font-display text-xl font-bold text-[#0F2D4E]">Nenhuma divergência pendente</h2><p className="mt-1 text-sm text-slate-600">As confirmações entre empresas e profissionais estão alinhadas.</p></div></div> : null}
        </section>
      </div>
    </AppShell>
  );
}
