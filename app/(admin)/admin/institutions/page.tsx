import { AppShell } from "@/components/app/shell";
import { deleteInstitutionAction, updateInstitutionAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminInstitutionsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  let query = supabase
    .from("institutions")
    .select("id,name,status,created_at,created_by,approved_by")
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);

  const { data: institutions } = await query;

  return (
    <AppShell eyebrow="Administrador" title="Instituições">
      <div className="space-y-5">
        {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir: {params.error}</p> : null}
        {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Operação realizada.</p> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Gerenciar instituições</h2>
          <p className="mt-1 text-sm text-slate-600">Aprove sugestões pendentes, padronize nomes, arquive duplicadas ou exclua registros incorretos.</p>
          <form className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]" action="/admin/institutions">
            <input name="q" defaultValue={params.q ?? ""} className="field-input" placeholder="Pesquisar instituição" />
            <select name="status" defaultValue={params.status ?? ""} className="field-input">
              <option value="">Todas as situações</option>
              <option value="pending">Pendente</option>
              <option value="active">Ativa</option>
              <option value="archived">Arquivada</option>
            </select>
            <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <table className="data-table">
            <thead>
              <tr>
                <th>Instituição</th>
                <th>Situação</th>
                <th>Criada em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(institutions ?? []).map((institution) => (
                <tr key={institution.id}>
                  <td>
                    <form id={`institution-${institution.id}`} action={updateInstitutionAction}>
                      <input type="hidden" name="institutionId" value={institution.id} />
                      <input name="name" defaultValue={institution.name} className="field-input min-w-[220px]" />
                    </form>
                  </td>
                  <td>
                    <select name="status" defaultValue={institution.status} form={`institution-${institution.id}`} className="rounded border border-slate-300 px-2 py-2 text-xs">
                      <option value="pending">Pendente</option>
                      <option value="active">Ativa</option>
                      <option value="archived">Arquivada</option>
                    </select>
                  </td>
                  <td>{new Date(institution.created_at).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <div className="grid gap-2">
                      <button form={`institution-${institution.id}`} className="rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white">Salvar / Aprovar</button>
                      <form action={updateInstitutionAction}>
                        <input type="hidden" name="institutionId" value={institution.id} />
                        <input type="hidden" name="name" value={institution.name} />
                        <input type="hidden" name="status" value="archived" />
                        <button className="w-full rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white">Arquivar</button>
                      </form>
                      <form action={deleteInstitutionAction}>
                        <input type="hidden" name="institutionId" value={institution.id} />
                        <button className="w-full rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white">Excluir</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {(institutions ?? []).length === 0 ? <tr><td colSpan={4}>Nenhuma instituição encontrada.</td></tr> : null}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
