import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type HiringRow = {
  id: string;
  updated_at: string;
  professional: { full_name: string } | { full_name: string }[] | null;
  demand: { title: string; company: { trade_name: string } | { trade_name: string }[] | null } | { title: string; company: { trade_name: string } | { trade_name: string }[] | null }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminHiringsPage() {
  const supabase = await createServerClient();
  const { data: hirings } = await supabase.from("screening_processes").select("id,updated_at,professional:professionals(full_name),demand:demands(title,company:companies(trade_name))").eq("status", "hired").order("updated_at", { ascending: false });

  return (
    <AppShell eyebrow="Administrador" title="Contratacoes">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <table className="data-table">
          <thead><tr><th>Candidato</th><th>Empresa</th><th>Demanda</th><th>Data</th></tr></thead>
          <tbody>
            {((hirings ?? []) as unknown as HiringRow[]).map((row) => {
              const demand = one(row.demand);
              const company = one(demand?.company ?? null);
              return <tr key={row.id}><td>{one(row.professional)?.full_name}</td><td>{company?.trade_name}</td><td>{demand?.title}</td><td>{new Date(row.updated_at).toLocaleDateString("pt-BR")}</td></tr>;
            })}
            {(hirings ?? []).length === 0 ? <tr><td colSpan={4}>Nenhuma contratacao registrada.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
