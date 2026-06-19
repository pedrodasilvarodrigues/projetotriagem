import { AppShell } from "@/components/app/shell";
import { createAdminDemandAction, updateAdminDemandStatusAction } from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

type DemandRow = {
  id: string;
  title: string;
  description: string;
  openings: number;
  status: string;
  city: string;
  state: string;
  salary_min: number | null;
  salary_max: number | null;
  minimum_experience_months: number;
  education_minimum: string;
  technical_skills: string[] | null;
  internal_notes: string | null;
  company: { trade_name: string } | { trade_name: string }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDemandsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  let query = supabase
    .from("demands")
    .select("id,title,description,openings,status,city,state,salary_min,salary_max,minimum_experience_months,education_minimum,technical_skills,internal_notes,company:companies(trade_name)")
    .order("created_at", { ascending: false })
    .limit(120);

  if (params.status) query = query.eq("status", params.status);
  if (params.q) query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,city.ilike.%${params.q}%`);

  const [{ data: demands }, { data: companies }, { data: processes }] = await Promise.all([
    query,
    supabase.from("companies").select("id,trade_name,status,city,state").is("deleted_at", null).order("trade_name"),
    supabase.from("screening_processes").select("id,demand_id,professional_id,status").limit(500)
  ]);

  return (
    <AppShell eyebrow="Administrador" title="Demandas">
      <div className="space-y-5">
        {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Nao foi possivel concluir: {params.error}</p> : null}
        {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Operacao realizada.</p> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Criar demanda</h2>
          <form action={createAdminDemandAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold md:col-span-2">Empresa<select name="companyId" required className="field-input mt-2"><option value="">Selecionar empresa</option>{(companies ?? []).map((company) => <option key={company.id} value={company.id}>{company.trade_name}</option>)}</select></label>
            <label className="text-sm font-semibold">Nome da demanda<input name="name" required className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Cargo<input name="title" required className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Salario minimo<input name="salaryMin" type="number" min="0" className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Salario maximo<input name="salaryMax" type="number" min="0" className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Cidade<input name="city" required className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Estado<input name="state" required maxLength={2} className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Escolaridade<select name="educationMinimum" className="field-input mt-2"><option value="fundamental">Fundamental</option><option value="medio">Medio</option><option value="tecnico">Tecnico</option><option value="superior">Superior</option><option value="pos">Pos</option><option value="mba">MBA</option><option value="mestrado">Mestrado</option><option value="doutorado">Doutorado</option></select></label>
            <label className="text-sm font-semibold">Experiencia minima (meses)<input name="minimumExperienceMonths" type="number" min="0" defaultValue={0} className="field-input mt-2" /></label>
            <label className="text-sm font-semibold">Modalidade<select name="modality" className="field-input mt-2"><option value="presencial">Presencial</option><option value="hibrido">Hibrido</option><option value="remoto">Remoto</option></select></label>
            <label className="text-sm font-semibold">Contrato<select name="contractType" className="field-input mt-2"><option value="clt">CLT</option><option value="pj">PJ</option><option value="temporario">Temporario</option><option value="estagio">Estagio</option><option value="aprendiz">Aprendiz</option></select></label>
            <label className="text-sm font-semibold md:col-span-2">Requisitos<input name="technicalSkills" className="field-input mt-2" placeholder="Excel, atendimento, CNH B" /></label>
            <label className="text-sm font-semibold md:col-span-2">Cursos obrigatorios<input name="requiredCourses" className="field-input mt-2" /></label>
            <label className="text-sm font-semibold md:col-span-2">Observacoes<textarea name="internalNotes" className="field-input mt-2 min-h-20" /></label>
            <label className="text-sm font-semibold md:col-span-2">Descricao<textarea name="description" required className="field-input mt-2 min-h-24" /></label>
            <button className="rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white md:col-span-2">Criar demanda</button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]" action="/admin/demands">
            <input name="q" defaultValue={params.q ?? ""} className="field-input" placeholder="Buscar cargo, cidade ou requisito" />
            <select name="status" defaultValue={params.status ?? ""} className="field-input"><option value="">Todos</option><option value="draft">Rascunho</option><option value="active">Aberta</option><option value="screening">Em triagem</option><option value="closed">Encerrada</option><option value="cancelled">Arquivada</option></select>
            <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <table className="data-table">
            <thead><tr><th>Demanda</th><th>Requisitos</th><th>Compatibilidades</th><th>Status</th><th>Controle</th></tr></thead>
            <tbody>
              {((demands ?? []) as unknown as DemandRow[]).map((demand) => {
                const linked = (processes ?? []).filter((process) => process.demand_id === demand.id);
                return (
                  <tr key={demand.id}>
                    <td><strong>{demand.title}</strong><p className="text-xs text-slate-500">{one(demand.company)?.trade_name} · {demand.city}/{demand.state}</p><p className="text-xs text-slate-500">Salario: {demand.salary_min ?? "-"} a {demand.salary_max ?? "-"}</p></td>
                    <td><p className="text-xs text-slate-600">Escolaridade: {demand.education_minimum}</p><p className="text-xs text-slate-600">Experiencia: {demand.minimum_experience_months} meses</p><p className="text-xs text-slate-600">{(demand.technical_skills ?? []).join(", ") || "Sem requisitos listados"}</p></td>
                    <td>{linked.length}<p className="text-xs text-slate-500">candidatos vinculados</p></td>
                    <td>{demand.status}</td>
                    <td>
                      <form action={updateAdminDemandStatusAction} className="grid gap-2">
                        <input type="hidden" name="demandId" value={demand.id} />
                        <input type="hidden" name="redirectTo" value="/admin/demands" />
                        <select name="status" defaultValue={demand.status} className="rounded border border-slate-300 px-2 py-2 text-xs">
                          <option value="active">Reabrir / aberta</option>
                          <option value="screening">Em triagem</option>
                          <option value="closed">Encerrar</option>
                          <option value="cancelled">Arquivar</option>
                        </select>
                        <button className="rounded bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Salvar</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {(demands ?? []).length === 0 ? <tr><td colSpan={5}>Nenhuma demanda encontrada.</td></tr> : null}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
