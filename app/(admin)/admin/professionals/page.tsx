import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { archiveProfessionalAction, updateProfessionalStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

export default async function AdminProfessionalsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; city?: string; error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  let query = supabase
    .from("professionals")
    .select("id,full_name,email,phone,desired_role,city,state,status,deleted_at,created_at")
    .order("updated_at", { ascending: false })
    .limit(120);

  if (params.q) query = query.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%,desired_role.ilike.%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);
  if (params.city) query = query.ilike("city", `%${params.city}%`);

  const [{ data: professionals }, { data: presentations }] = await Promise.all([
    query,
    supabase.from("professional_presentations").select("id,professional_id,company_id,status,presented_at,company:companies(trade_name)").order("presented_at", { ascending: false }).limit(80)
  ]);

  return (
    <AppShell eyebrow="Administrador" title="Profissionais">
      <div className="space-y-5">
        {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir: {params.error}</p> : null}
        {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Operação realizada.</p> : null}

        <section id="buscar" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Buscar e filtrar profissionais</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]" action="/admin/professionals">
            <input name="q" defaultValue={params.q ?? ""} className="field-input" placeholder="Nome, email ou cargo" />
            <input name="city" defaultValue={params.city ?? ""} className="field-input" placeholder="Cidade" />
            <select name="status" defaultValue={params.status ?? ""} className="field-input">
              <option value="">Todas as situações</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="suspended">Bloqueado</option>
              <option value="rejected">Reprovado</option>
            </select>
            <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
          </form>
        </section>

        <section id="status" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Gerenciamento completo</h2>
            <p className="text-sm text-slate-600">Visualize, bloqueie, arquive e reative profissionais. A apresentação de candidatos agora acontece dentro da aba Demandas, por compatibilidade.</p>
          </div>
          <table className="data-table">
            <thead><tr><th>Profissional</th><th>Perfil</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              {(professionals ?? []).map((professional) => (
                <tr key={professional.id}>
                  <td>
                    <strong>{professional.full_name}</strong>
                    <p className="text-xs text-slate-500">{professional.email ?? "Email não informado"} · {professional.phone ?? "Telefone não informado"}</p>
                  </td>
                  <td>{professional.desired_role}<p className="text-xs text-slate-500">{professional.city}/{professional.state}</p></td>
                  <td>{professional.deleted_at ? "Arquivado" : statusLabel(professional.status)}</td>
                  <td>
                    <div className="grid gap-2">
                      <Link className="rounded border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700" href={`/admin/professionals/${professional.id}`}>Ver perfil e currículo</Link>
                      <form action={updateProfessionalStatusAction}>
                        <input type="hidden" name="professionalId" value={professional.id} />
                        <input type="hidden" name="redirectTo" value="/admin/professionals" />
                        <select name="status" defaultValue={professional.status} className="mb-2 w-full rounded border border-slate-300 px-2 py-2 text-xs">
                          <option value="pending">Pendente</option>
                          <option value="approved">Aprovado / ativo</option>
                          <option value="suspended">Bloqueado</option>
                          <option value="rejected">Reprovado</option>
                        </select>
                        <button className="w-full rounded bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Salvar status</button>
                      </form>
                      <form action={archiveProfessionalAction}>
                        <input type="hidden" name="professionalId" value={professional.id} />
                        <input type="hidden" name="redirectTo" value="/admin/professionals" />
                        <button className="w-full rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white">{professional.deleted_at ? "Rearquivar" : "Arquivar"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {(professionals ?? []).length === 0 ? <tr><td colSpan={4}>Nenhum profissional encontrado.</td></tr> : null}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Histórico recente de apresentacoes</h2>
          <div className="mt-3 grid gap-2">
            {(presentations ?? []).slice(0, 8).map((presentation: any) => (
              <p key={presentation.id} className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                Profissional apresentado para <strong>{Array.isArray(presentation.company) ? presentation.company[0]?.trade_name : presentation.company?.trade_name}</strong> em {new Date(presentation.presented_at).toLocaleString("pt-BR")}.
              </p>
            ))}
            {(presentations ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma apresentação registrada ainda.</p> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
