import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { COURSE_MAX_ATTEMPTS } from "@/lib/courses/config";
import { createServerClient } from "@/lib/supabase/server";

type CourseRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  workload_hours: number;
  skill_tags: string[] | null;
};

type AttemptRow = {
  course_id: string;
  attempt_number: number;
  final_score: number;
  approved: boolean;
};

function courseStatus(courseId: string, attempts: AttemptRow[]) {
  const courseAttempts = attempts.filter((attempt) => attempt.course_id === courseId).sort((a, b) => b.attempt_number - a.attempt_number);
  if (courseAttempts.some((attempt) => attempt.approved)) return { label: "Aprovado", className: "bg-green-100 text-green-800", icon: CheckCircle2 };
  if (courseAttempts.length === 0) return { label: "Não iniciado", className: "bg-slate-100 text-slate-700", icon: Clock };
  if (courseAttempts.length < COURSE_MAX_ATTEMPTS) return { label: "Reprovado · 2ª tentativa disponível", className: "bg-amber-100 text-amber-800", icon: Clock };
  return { label: "Reprovado · encerrado", className: "bg-red-100 text-red-800", icon: XCircle };
}

export default async function ProfessionalCoursesPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: professional } = userData.user ? await supabase.from("professionals").select("id").eq("user_id", userData.user.id).maybeSingle() : { data: null };

  const [{ data: courses }, { data: attempts }] = await Promise.all([
    supabase.from("courses").select("id,title,description,category,workload_hours,skill_tags").eq("status", "published").order("created_at", { ascending: false }),
    professional?.id ? supabase.from("course_attempts").select("course_id,attempt_number,final_score,approved").eq("professional_id", professional.id) : Promise.resolve({ data: [] })
  ]);

  return (
    <AppShell eyebrow="Profissional" title="Cursos">
      <div className="space-y-5">
        {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir: {params.error}</p> : null}
        {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Operação realizada.</p> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <BookOpen aria-hidden="true" className="mt-1 text-[#F2811D]" size={26} />
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0F2D4E]">Cursos para aumentar sua compatibilidade</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Assista ao vídeo, faça a prova e ganhe certificações que ajudam a destacar seu perfil nas demandas compatíveis.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {((courses ?? []) as CourseRow[]).map((course) => {
            const status = courseStatus(course.id, (attempts ?? []) as AttemptRow[]);
            return (
              <article key={course.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#F2811D]/40 hover:shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#F2811D]">{course.category} · {course.workload_hours}h</p>
                    <h2 className="mt-2 font-display text-xl font-bold text-[#0F2D4E]">{course.title}</h2>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
                    <status.icon aria-hidden="true" size={14} />
                    {status.label}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{course.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(course.skill_tags ?? []).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tag}</span>)}
                </div>
                <Link href={`/professional/courses/${course.id}`} className="btn-primary mt-5 rounded-xl px-4 py-2 text-sm">Acessar curso</Link>
              </article>
            );
          })}
          {(courses ?? []).length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Nenhum curso publicado no momento.</p> : null}
        </section>
      </div>
    </AppShell>
  );
}
