import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { archiveProfessionalAction, updateProfessionalStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status-labels";

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProfessionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const [
    { data: professional },
    { data: educations },
    { data: experiences },
    { data: courses },
    { data: languages },
    { data: skills },
    { data: processes },
    { data: presentations }
  ] = await Promise.all([
    supabase.from("professionals").select("*").eq("id", id).maybeSingle(),
    supabase.from("professional_educations").select("level,institution,course_name,completed_at").eq("professional_id", id).order("created_at", { ascending: false }),
    supabase.from("professional_experiences").select("company_name,role_title,started_at,ended_at,is_current,description").eq("professional_id", id).order("started_at", { ascending: false }),
    supabase.from("professional_courses").select("name,institution,workload_hours,completed_at").eq("professional_id", id).order("created_at", { ascending: false }),
    supabase.from("professional_languages").select("language_name,proficiency").eq("professional_id", id).order("created_at", { ascending: false }),
    supabase.from("professional_skills").select("name,skill_type,proficiency").eq("professional_id", id).order("created_at", { ascending: false }),
    supabase.from("screening_processes").select("id,status,created_at,company_result,demand:demands(title,company:companies(trade_name))").eq("professional_id", id).order("created_at", { ascending: false }),
    supabase.from("professional_presentations").select("id,status,notes,presented_at,company:companies(trade_name)").eq("professional_id", id).order("presented_at", { ascending: false })
  ]);

  return (
    <AppShell eyebrow="Administrador" title="Perfil do profissional">
      {!professional ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p>Profissional não encontrado.</p>
          <Link href="/admin/professionals" className="mt-4 inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Voltar</Link>
        </section>
      ) : (
        <div className="space-y-5">
          <Link href="/admin/professionals" className="inline-flex text-sm font-semibold text-blue-700">← Voltar para profissionais</Link>

          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Cadastro completo</p>
              <h2 className="mt-1 text-2xl font-semibold">{professional.full_name}</h2>
              <p className="mt-2 text-sm text-slate-600">{professional.desired_role} · {professional.city}/{professional.state}</p>
              <p className="mt-2 text-sm text-slate-600">{professional.email ?? "Email não informado"} · {professional.phone ?? "Telefone não informado"}</p>
              <p className="mt-4 text-sm leading-6 text-slate-700">{professional.summary ?? "Resumo profissional ainda não informado."}</p>
            </div>
            <div className="grid gap-2 rounded-lg bg-slate-50 p-4">
              <p className="rounded border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                Para apresentar este profissional, acesse a aba Demandas e escolha a demanda desejada. A lista será ordenada por compatibilidade.
              </p>
              <form action={updateProfessionalStatusAction} className="grid gap-2">
                <input type="hidden" name="professionalId" value={professional.id} />
                <input type="hidden" name="redirectTo" value={`/admin/professionals/${professional.id}`} />
                <select name="status" defaultValue={professional.status} className="field-input">
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="suspended">Bloqueado</option>
                  <option value="rejected">Reprovado</option>
                </select>
                <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Atualizar status</button>
              </form>
              <form action={archiveProfessionalAction}>
                <input type="hidden" name="professionalId" value={professional.id} />
                <input type="hidden" name="redirectTo" value={`/admin/professionals/${professional.id}`} />
                <button className="w-full rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Arquivar profissional</button>
              </form>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Currículo estruturado</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div><h3 className="font-semibold">Formação</h3>{(educations ?? []).map((item) => <p key={`${item.institution}-${item.course_name}`} className="mt-2 text-sm text-slate-600">{item.course_name} · {item.institution}</p>)}</div>
              <div><h3 className="font-semibold">Experiências</h3>{(experiences ?? []).map((item) => <p key={`${item.company_name}-${item.role_title}`} className="mt-2 text-sm text-slate-600">{item.role_title} · {item.company_name}</p>)}</div>
              <div><h3 className="font-semibold">Cursos</h3>{(courses ?? []).map((item) => <p key={item.name} className="mt-2 text-sm text-slate-600">{item.name} · {item.institution ?? "Instituição não informada"}</p>)}</div>
              <div><h3 className="font-semibold">Idiomas e habilidades</h3>{(languages ?? []).map((item) => <p key={item.language_name} className="mt-2 text-sm text-slate-600">{item.language_name} · {item.proficiency}</p>)}{(skills ?? []).map((item) => <p key={item.name} className="mt-2 text-sm text-slate-600">{item.name} · {item.skill_type} · {item.proficiency ?? 1}/5</p>)}</div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Histórico de processos e apresentacoes</h2>
            <div className="mt-4 grid gap-3">
              {(presentations ?? []).map((item) => <p key={item.id} className="rounded border border-slate-200 p-3 text-sm">Apresentado para <strong>{one(item.company)?.trade_name}</strong> em {new Date(item.presented_at).toLocaleString("pt-BR")} · {statusLabel(item.status)}</p>)}
              {(processes ?? []).map((process) => {
                const demand = one(process.demand);
                const company = one(demand?.company ?? null);
                return <p key={process.id} className="rounded border border-slate-200 p-3 text-sm">{demand?.title} · {company?.trade_name} · situação: {statusLabel(process.status)}</p>;
              })}
              {(presentations ?? []).length === 0 && (processes ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhum histórico registrado.</p> : null}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
