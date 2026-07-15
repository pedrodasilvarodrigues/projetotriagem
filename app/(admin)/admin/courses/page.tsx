import Link from "next/link";
import { BookOpen, FileQuestion, Plus, Search, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { CourseForm } from "@/components/courses/course-form";
import { deleteCourseAction } from "@/lib/actions/courses";
import { createServerClient } from "@/lib/supabase/server";

type CourseRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  workload_hours: number;
  skill_tags: string[] | null;
  status: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado"
};

type MetricCard = {
  label: string;
  value: number;
  icon: LucideIcon;
};

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from("courses")
    .select("id,title,description,category,workload_hours,skill_tags,status,created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (params.q) query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,category.ilike.%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);

  const [{ data: courses }, { count: publishedCount }, { count: draftCount }, { count: attemptsCount }] = await Promise.all([
    query,
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("course_attempts").select("id", { count: "exact", head: true })
  ]);

  return (
    <AppShell eyebrow="Administrador" title="Cursos">
      <div className="space-y-5">
        {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir: {params.error}</p> : null}
        {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Operação realizada.</p> : null}

        <section className="grid gap-4 md:grid-cols-3">
          {([
            { label: "Cursos publicados", value: publishedCount ?? 0, icon: BookOpen },
            { label: "Rascunhos", value: draftCount ?? 0, icon: FileQuestion },
            { label: "Tentativas registradas", value: attemptsCount ?? 0, icon: Search }
          ] satisfies MetricCard[]).map((item) => (
            <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <item.icon aria-hidden="true" className="text-[#F2811D]" size={22} />
              <strong className="mt-3 block text-3xl text-[#0F2D4E]">{item.value}</strong>
              <p className="text-sm text-slate-600">{item.label}</p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#F2811D]/10 text-[#F2811D]"><Plus aria-hidden="true" size={20} /></span>
            <div>
              <h2 className="text-lg font-semibold">Criar curso</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Cadastre vídeo, tags de habilidade e prova. Apenas cursos publicados aparecem para profissionais.</p>
            </div>
          </div>
          <div className="mt-5">
            <CourseForm />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]" action="/admin/courses">
            <input name="q" defaultValue={params.q ?? ""} className="field-input" placeholder="Pesquisar curso, área ou descrição" />
            <select name="status" defaultValue={params.status ?? ""} className="field-input">
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
            <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <table className="data-table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Área</th>
                <th>Situação</th>
                <th>Tags</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {((courses ?? []) as CourseRow[]).map((course) => (
                <tr key={course.id}>
                  <td><strong>{course.title}</strong><br /><span className="text-xs text-slate-500">{course.workload_hours}h · criado em {new Date(course.created_at).toLocaleDateString("pt-BR")}</span></td>
                  <td>{course.category}</td>
                  <td>{statusLabels[course.status] ?? course.status}</td>
                  <td>{(course.skill_tags ?? []).join(", ") || "Sem tags"}</td>
                  <td>
                    <div className="grid gap-2">
                      <Link href={`/admin/courses/${course.id}`} className="rounded bg-blue-700 px-3 py-2 text-center text-xs font-semibold text-white">Editar / resultados</Link>
                      <form action={deleteCourseAction}>
                        <input type="hidden" name="courseId" value={course.id} />
                        <button className="w-full rounded bg-red-700 px-3 py-2 text-xs font-semibold text-white">Excluir / arquivar</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {(courses ?? []).length === 0 ? <tr><td colSpan={5}>Nenhum curso encontrado.</td></tr> : null}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
