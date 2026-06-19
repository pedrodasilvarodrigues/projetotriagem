import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { archiveCompanyAction, updateCompanyStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const [{ data: company }, { data: demands }, { data: presentations }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).maybeSingle(),
    supabase.from("demands").select("id,title,status,city,state,openings,salary_min,salary_max").eq("company_id", id).order("created_at", { ascending: false }),
    supabase.from("professional_presentations").select("id,status,notes,presented_at,professional:professionals(id,full_name,desired_role,city,state)").eq("company_id", id).order("presented_at", { ascending: false })
  ]);

  return (
    <AppShell eyebrow="Administrador" title="Detalhes da empresa">
      {!company ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">Empresa não encontrada.</section>
      ) : (
        <div className="space-y-5">
          <Link href="/admin/companies" className="inline-flex text-sm font-semibold text-blue-700">← Voltar para empresas</Link>
          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Cadastro empresarial</p>
              <h2 className="mt-1 text-2xl font-semibold">{company.trade_name}</h2>
              <p className="mt-2 text-sm text-slate-600">{company.legal_name}</p>
              <p className="mt-2 text-sm text-slate-600">{company.city}/{company.state} · {company.corporate_email ?? "Email não informado"} · {company.phone ?? "Telefone não informado"}</p>
              <p className="mt-4 text-sm leading-6 text-slate-700">{company.description ?? "Descrição empresarial ainda não informada."}</p>
            </div>
            <div className="grid gap-2 rounded-lg bg-slate-50 p-4">
              <form action={updateCompanyStatusAction} className="grid gap-2">
                <input type="hidden" name="companyId" value={company.id} />
                <input type="hidden" name="redirectTo" value={`/admin/companies/${company.id}`} />
                <select name="status" defaultValue={company.status} className="field-input">
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovada</option>
                  <option value="suspended">Bloqueada</option>
                  <option value="rejected">Reprovada</option>
                </select>
                <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Atualizar status</button>
              </form>
              <form action={archiveCompanyAction}>
                <input type="hidden" name="companyId" value={company.id} />
                <input type="hidden" name="redirectTo" value={`/admin/companies/${company.id}`} />
                <button className="w-full rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Arquivar empresa</button>
              </form>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Demandas da empresa</h2>
            <div className="mt-4 grid gap-3">
              {(demands ?? []).map((demand) => (
                <article key={demand.id} className="rounded border border-slate-200 p-3 text-sm">
                  <strong>{demand.title}</strong>
                  <p className="text-slate-600">{demand.city}/{demand.state} · {demand.openings} vaga(s) · {statusLabel(demand.status)}</p>
                </article>
              ))}
              {(demands ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma demanda registrada.</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Profissionais apresentados</h2>
            <div className="mt-4 grid gap-3">
              {(presentations ?? []).map((presentation) => {
                const professional = one(presentation.professional);
                return (
                  <article key={presentation.id} className="rounded border border-slate-200 p-3 text-sm">
                    <strong>{professional?.full_name}</strong>
                    <p className="text-slate-600">{professional?.desired_role} · {professional?.city}/{professional?.state}</p>
                    <p className="text-xs text-slate-500">Apresentado em {new Date(presentation.presented_at).toLocaleString("pt-BR")} · {statusLabel(presentation.status)}</p>
                  </article>
                );
              })}
              {(presentations ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhum profissional apresentado ainda.</p> : null}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
