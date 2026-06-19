import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

export default async function CompanyHistoryPage() {
  const supabase = await createServerClient();
  const { data: demands } = await supabase.from("demands").select("id,title,status,openings,updated_at").in("status", ["closed", "cancelled"]).order("updated_at", { ascending: false });

  return (
    <AppShell eyebrow="Empresa" title="Histórico">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <table className="data-table">
          <thead><tr><th>Demanda</th><th>Vagas</th><th>Situação</th><th>Encerramento</th></tr></thead>
          <tbody>
            {(demands ?? []).map((demand) => <tr key={demand.id}><td>{demand.title}</td><td>{demand.openings}</td><td>{statusLabel(demand.status)}</td><td>{new Date(demand.updated_at).toLocaleDateString("pt-BR")}</td></tr>)}
            {(demands ?? []).length === 0 ? <tr><td colSpan={4}>Nenhuma demanda encerrada.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
