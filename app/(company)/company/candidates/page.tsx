import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type CandidateRow = {
  id: string;
  full_name: string;
  city: string;
  state: string;
  desired_role: string;
  education_level: string;
  status: string;
};

export default async function CompanyCandidatesPage() {
  const supabase = await createServerClient();
  const { data: candidates } = await supabase
    .from("professionals")
    .select("id,full_name,city,state,desired_role,education_level,status")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <AppShell eyebrow="Empresa" title="Analise de Candidatos">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm text-slate-600">Lista de profissionais cadastrados no portal para consulta da sua empresa.</p>
        <table className="data-table">
          <thead><tr><th>Candidato</th><th>Objetivo</th><th>Local</th><th>Escolaridade</th><th>Status</th></tr></thead>
          <tbody>
            {((candidates ?? []) as unknown as CandidateRow[]).map((row) => <tr key={row.id}><td>{row.full_name}</td><td>{row.desired_role}</td><td>{row.city}/{row.state}</td><td>{row.education_level}</td><td>{row.status}</td></tr>)}
            {(candidates ?? []).length === 0 ? <tr><td colSpan={5}>Nenhum candidato cadastrado ainda.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
