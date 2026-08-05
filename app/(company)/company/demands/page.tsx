import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { DemandLifecycleControls } from "@/components/company/demand-lifecycle-controls";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

export default async function CompanyDemandsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", userData.user?.id).maybeSingle();
  const { data: demands } = company?.id
    ? await supabase
        .from("demands")
        .select("id,name,title,status,openings,city,state,created_at,processes:screening_processes(status)")
        .eq("company_id", company.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <AppShell eyebrow="Empresa" title="Demandas">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {params.message ? <p className="mb-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">Operação realizada com sucesso.</p> : null}
            {params.error ? (
              <p className="mb-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {params.error === "demanda-com-contratacao-deve-ser-arquivada"
                  ? "Esta demanda possui uma contratação e, por isso, só pode ser arquivada."
                  : "Não foi possível concluir a ação. Atualize a página e tente novamente."}
              </p>
            ) : null}
            <p className="text-sm text-slate-600">Demandas ativas ficam disponíveis para profissionais; demandas arquivadas permanecem internas e preservam o histórico.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Nome da demanda</th><th>Cargo</th><th>Vagas</th><th>Local</th><th>Situação</th><th>Criada em</th><th>Ação</th></tr></thead>
            <tbody>
              {(demands ?? []).map((demand) => {
                const hasHiredProfessional = (demand.processes ?? []).some((process) => process.status === "hired");
                return (
                <tr key={demand.id}>
                  <td>{demand.name ?? demand.title}</td>
                  <td>{demand.title}</td>
                  <td>{demand.openings}</td>
                  <td>{demand.city}/{demand.state}</td>
                  <td>{statusLabel(demand.status)}</td>
                  <td>{new Date(demand.created_at).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <div className="flex min-w-max items-center gap-3">
                      <Link href={`/company/demands/${demand.id}`} className="font-semibold text-blue-700 hover:underline">Editar demanda</Link>
                      <DemandLifecycleControls demandId={demand.id} status={demand.status} hasHiredProfessional={hasHiredProfessional} redirectTo="/company/demands" compact />
                    </div>
                  </td>
                </tr>
                );
              })}
              {(demands ?? []).length === 0 ? <tr><td colSpan={7}>Nenhuma demanda cadastrada.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
