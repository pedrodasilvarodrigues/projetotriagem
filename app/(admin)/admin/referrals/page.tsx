import { AppShell } from "@/components/app/shell";
import { updateProcessStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

type ReferralRow = {
  id: string;
  status: string;
  professional: { full_name: string } | { full_name: string }[] | null;
  demand: { title: string; company: { trade_name: string } | { trade_name: string }[] | null } | { title: string; company: { trade_name: string } | { trade_name: string }[] | null }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReferralsPage() {
  const supabase = await createServerClient();
  const { data: referrals } = await supabase.from("screening_processes").select("id,status,professional:professionals(full_name),demand:demands(title,company:companies(trade_name))").order("updated_at", { ascending: false }).limit(80);

  return (
    <AppShell eyebrow="Administrador" title="Encaminhamentos">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <table className="data-table">
          <thead><tr><th>Candidato</th><th>Empresa</th><th>Demanda</th><th>Status</th><th>Controle</th></tr></thead>
          <tbody>
            {((referrals ?? []) as unknown as ReferralRow[]).map((row) => {
              const demand = one(row.demand);
              const company = one(demand?.company ?? null);
              return (
                <tr key={row.id}>
                  <td>{one(row.professional)?.full_name}</td><td>{company?.trade_name}</td><td>{demand?.title}</td><td>{row.status}</td>
                  <td>
                    <form action={updateProcessStatusAction} className="flex gap-2">
                      <input type="hidden" name="processId" value={row.id} />
                      <select name="status" className="rounded border border-slate-300 px-2 py-1 text-xs">
                        <option value="analysis">Em analise</option>
                        <option value="screening">Triagem</option>
                        <option value="pre_approved">Reserva</option>
                        <option value="forwarded">Encaminhado</option>
                        <option value="hired">Contratado</option>
                        <option value="rejected">Reprovado</option>
                      </select>
                      <button className="rounded bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Salvar</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {(referrals ?? []).length === 0 ? <tr><td colSpan={5}>Nenhum encaminhamento registrado.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
