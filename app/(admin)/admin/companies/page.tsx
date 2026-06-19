import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { archiveCompanyAction, updateCompanyStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  let query = supabase
    .from("companies")
    .select("id,trade_name,legal_name,corporate_email,phone,city,state,status,deleted_at,created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (params.q) query = query.or(`trade_name.ilike.%${params.q}%,legal_name.ilike.%${params.q}%,corporate_email.ilike.%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);

  const [{ data: companies }, { data: presentations }, { data: demands }] = await Promise.all([
    query,
    supabase.from("professional_presentations").select("id,company_id,professional:professionals(full_name),presented_at").order("presented_at", { ascending: false }).limit(80),
    supabase.from("demands").select("id,company_id,title,status").order("created_at", { ascending: false }).limit(120)
  ]);

  return (
    <AppShell eyebrow="Administrador" title="Empresas">
      <div className="space-y-5">
        {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Nao foi possivel concluir: {params.error}</p> : null}
        {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Operacao realizada.</p> : null}
        <section id="buscar" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Buscar empresas</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]" action="/admin/companies">
            <input name="q" defaultValue={params.q ?? ""} className="field-input" placeholder="Nome, razao social ou email" />
            <select name="status" defaultValue={params.status ?? ""} className="field-input">
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovada</option>
              <option value="suspended">Bloqueada</option>
              <option value="rejected">Reprovada</option>
            </select>
            <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
          </form>
        </section>
        <section id="status" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <table className="data-table">
            <thead><tr><th>Empresa</th><th>Demandas</th><th>Apresentados</th><th>Status</th><th>Acoes</th></tr></thead>
            <tbody>
              {(companies ?? []).map((company) => {
                const companyDemands = (demands ?? []).filter((item) => item.company_id === company.id);
                const companyPresentations = (presentations ?? []).filter((item) => item.company_id === company.id);
                return (
                  <tr key={company.id}>
                    <td>
                      <strong>{company.trade_name}</strong>
                      <p className="text-xs text-slate-500">{company.legal_name}</p>
                      <p className="text-xs text-slate-500">{company.city}/{company.state} · {company.corporate_email ?? "Email nao informado"}</p>
                    </td>
                    <td>{companyDemands.length}<p className="text-xs text-slate-500">{companyDemands.slice(0, 2).map((item) => item.title).join(", ")}</p></td>
                    <td>{companyPresentations.length}<p className="text-xs text-slate-500">Profissionais apresentados</p></td>
                    <td>{company.deleted_at ? "arquivada" : company.status}</td>
                    <td>
                      <div className="grid gap-2">
                        <Link href={`/admin/companies/${company.id}`} className="rounded border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700">Ver detalhes</Link>
                        <form action={updateCompanyStatusAction}>
                          <input type="hidden" name="companyId" value={company.id} />
                          <input type="hidden" name="redirectTo" value="/admin/companies" />
                          <select name="status" defaultValue={company.status} className="mb-2 w-full rounded border border-slate-300 px-2 py-2 text-xs">
                            <option value="pending">Pendente</option>
                            <option value="approved">Aprovada / ativa</option>
                            <option value="suspended">Bloqueada</option>
                            <option value="rejected">Reprovada</option>
                          </select>
                          <button className="w-full rounded bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Salvar status</button>
                        </form>
                        <form action={archiveCompanyAction}>
                          <input type="hidden" name="companyId" value={company.id} />
                          <input type="hidden" name="redirectTo" value="/admin/companies" />
                          <button className="w-full rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white">Arquivar</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(companies ?? []).length === 0 ? <tr><td colSpan={5}>Nenhuma empresa encontrada.</td></tr> : null}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
