import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type DemandRow = {
  id: string;
  title: string;
  openings: number;
  status: string;
  city: string;
  state: string;
  company: { trade_name: string } | { trade_name: string }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDemandsPage() {
  const supabase = await createServerClient();
  const { data: demands } = await supabase.from("demands").select("id,title,openings,status,city,state,company:companies(trade_name)").in("status", ["active", "screening"]).order("created_at", { ascending: false });

  return (
    <AppShell eyebrow="Administrador" title="Demandas abertas">
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <table className="data-table">
          <thead><tr><th>Empresa</th><th>Cargo</th><th>Vagas</th><th>Local</th><th>Status</th></tr></thead>
          <tbody>
            {((demands ?? []) as unknown as DemandRow[]).map((demand) => <tr key={demand.id}><td>{one(demand.company)?.trade_name}</td><td>{demand.title}</td><td>{demand.openings}</td><td>{demand.city}/{demand.state}</td><td>{demand.status}</td></tr>)}
            {(demands ?? []).length === 0 ? <tr><td colSpan={5}>Nenhuma demanda aberta.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
