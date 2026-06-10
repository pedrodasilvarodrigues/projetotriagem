import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type ProcessRow = {
  id: string;
  status: string;
  updated_at: string;
  demand: { title: string; city: string; state: string } | { title: string; city: string; state: string }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfessionalScreeningStatusPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: professional } = await supabase.from("professionals").select("id").eq("user_id", userData.user?.id).maybeSingle();
  const { data: processes } = professional?.id
    ? await supabase.from("screening_processes").select("id,status,updated_at,demand:demands(title,city,state)").eq("professional_id", professional.id).order("updated_at", { ascending: false })
    : { data: [] };

  return (
    <AppShell eyebrow="Profissional" title="Status de Triagem">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Demanda</th><th>Local</th><th>Status</th><th>Atualizacao</th></tr></thead>
            <tbody>
              {((processes ?? []) as unknown as ProcessRow[]).map((process) => {
                const demand = one(process.demand);
                return <tr key={process.id}><td>{demand?.title ?? "Demanda"}</td><td>{demand?.city}/{demand?.state}</td><td>{process.status}</td><td>{new Date(process.updated_at).toLocaleDateString("pt-BR")}</td></tr>;
              })}
              {(processes ?? []).length === 0 ? <tr><td colSpan={4}>Nenhuma triagem em andamento.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
