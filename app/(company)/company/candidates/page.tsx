import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type CandidateRow = {
  id: string;
  status: string;
  company_result: string | null;
  professional: { full_name: string; city: string; state: string } | { full_name: string; city: string; state: string }[] | null;
  demand: { title: string } | { title: string }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompanyCandidatesPage() {
  const supabase = await createServerClient();
  const { data: candidates } = await supabase
    .from("screening_processes")
    .select("id,status,company_result,professional:professionals(full_name,city,state),demand:demands(title)")
    .in("status", ["interview", "forwarded", "hired"])
    .order("updated_at", { ascending: false });

  return (
    <AppShell eyebrow="Empresa" title="Candidatos Encaminhados">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <table className="data-table">
          <thead><tr><th>Candidato</th><th>Demanda</th><th>Local</th><th>Status</th><th>Resultado</th></tr></thead>
          <tbody>
            {((candidates ?? []) as unknown as CandidateRow[]).map((row) => {
              const professional = one(row.professional);
              const demand = one(row.demand);
              return <tr key={row.id}><td>{professional?.full_name}</td><td>{demand?.title}</td><td>{professional?.city}/{professional?.state}</td><td>{row.status}</td><td>{row.company_result ?? "Em andamento"}</td></tr>;
            })}
            {(candidates ?? []).length === 0 ? <tr><td colSpan={5}>Nenhum candidato encaminhado ainda.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
