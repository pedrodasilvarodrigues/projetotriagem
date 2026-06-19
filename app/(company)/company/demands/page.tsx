import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { closeDemandAction } from "@/lib/actions/workspace";
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
        .select("id,name,title,status,openings,city,state,created_at")
        .eq("company_id", company.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <AppShell eyebrow="Empresa" title="Demandas Ativas">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {params.message ? <p className="mb-2 rounded-md bg-green-50 p-2 text-sm text-green-700">Operação realizada com sucesso.</p> : null}
            {params.error ? <p className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-700">Não foi possível concluir a ação: {params.error}</p> : null}
            <p className="text-sm text-slate-600">Demandas ativas ficam disponíveis para profissionais; rascunhos e encerradas permanecem internos.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Nome da demanda</th><th>Cargo</th><th>Vagas</th><th>Local</th><th>Situação</th><th>Criada em</th><th>Ação</th></tr></thead>
            <tbody>
              {(demands ?? []).map((demand) => (
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
                      {!['closed', 'cancelled'].includes(demand.status) ? (
                        <form action={closeDemandAction}>
                          <input type="hidden" name="demandId" value={demand.id} />
                          <input type="hidden" name="redirectTo" value="/company/demands" />
                          <button type="submit" className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white">Encerrar demanda</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {(demands ?? []).length === 0 ? <tr><td colSpan={7}>Nenhuma demanda cadastrada.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
