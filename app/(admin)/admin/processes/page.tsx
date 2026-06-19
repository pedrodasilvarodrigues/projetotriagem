import { AppShell } from "@/components/app/shell";
import { updateProcessStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

type ProcessRow = {
  id: string;
  status: string;
  company_result: string | null;
  created_at: string;
  professional: { full_name: string; desired_role: string } | { full_name: string; desired_role: string }[] | null;
  demand: { title: string; company: { trade_name: string } | { trade_name: string }[] | null } | { title: string; company: { trade_name: string } | { trade_name: string }[] | null }[] | null;
};

const statusLabels: Record<string, string> = {
  received: "Compatibilidade",
  analysis: "Em analise",
  screening: "Triagem",
  pre_approved: "Aprovado",
  training: "Triagem",
  forwarded: "Apresentado",
  interview: "Entrevista",
  hired: "Contratado",
  rejected: "Reprovado",
  waiting: "Encerrado"
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProcessesPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  let query = supabase
    .from("screening_processes")
    .select("id,status,company_result,created_at,professional:professionals(full_name,desired_role),demand:demands(title,company:companies(trade_name))")
    .order("updated_at", { ascending: false })
    .limit(120);
  if (params.status) query = query.eq("status", params.status);
  const { data: processes } = await query;

  const flow = ["Demanda", "Compatibilidade", "Triagem", "Apresentacao", "Entrevista", "Contratacao"];

  return (
    <AppShell eyebrow="Administrador" title="Processos">
      <div className="space-y-5">
        {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Nao foi possivel concluir: {params.error}</p> : null}
        {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Processo atualizado.</p> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Fluxo operacional</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-6">
            {flow.map((item, index) => <div key={item} className="rounded border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-900">{index + 1}. {item}</div>)}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[220px_auto]" action="/admin/processes">
            <select name="status" defaultValue={params.status ?? ""} className="field-input"><option value="">Todos os status</option><option value="screening">Triagem</option><option value="analysis">Em analise</option><option value="forwarded">Apresentado</option><option value="interview">Entrevista</option><option value="pre_approved">Aprovado</option><option value="rejected">Reprovado</option><option value="hired">Contratado</option><option value="waiting">Encerrado</option></select>
            <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <table className="data-table">
            <thead><tr><th>Profissional</th><th>Demanda</th><th>Etapa</th><th>Observacoes / resultado</th><th>Atualizar</th></tr></thead>
            <tbody>
              {((processes ?? []) as unknown as ProcessRow[]).map((process) => {
                const professional = one(process.professional);
                const demand = one(process.demand);
                const company = one(demand?.company ?? null);
                return (
                  <tr key={process.id}>
                    <td><strong>{professional?.full_name}</strong><p className="text-xs text-slate-500">{professional?.desired_role}</p></td>
                    <td>{demand?.title}<p className="text-xs text-slate-500">{company?.trade_name}</p></td>
                    <td>{statusLabels[process.status] ?? process.status}</td>
                    <td>{process.company_result ?? "Sem observacoes registradas."}</td>
                    <td>
                      <form action={updateProcessStatusAction} className="grid gap-2">
                        <input type="hidden" name="processId" value={process.id} />
                        <input type="hidden" name="redirectTo" value="/admin/processes" />
                        <select name="status" defaultValue={process.status} className="rounded border border-slate-300 px-2 py-2 text-xs">
                          <option value="screening">Triagem</option>
                          <option value="analysis">Em analise</option>
                          <option value="forwarded">Apresentado</option>
                          <option value="interview">Entrevista</option>
                          <option value="pre_approved">Aprovado</option>
                          <option value="rejected">Reprovado</option>
                          <option value="hired">Contratado</option>
                          <option value="waiting">Encerrado</option>
                        </select>
                        <textarea name="companyResult" defaultValue={process.company_result ?? ""} className="rounded border border-slate-300 px-2 py-2 text-xs" placeholder="Observacao, entrevista ou resultado" />
                        <button className="rounded bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Salvar processo</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {(processes ?? []).length === 0 ? <tr><td colSpan={5}>Nenhum processo encontrado.</td></tr> : null}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
