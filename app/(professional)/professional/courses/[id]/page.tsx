import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { CourseQuizPanel } from "@/components/courses/course-quiz-panel";
import { createServerClient } from "@/lib/supabase/server";

type CourseRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  workload_hours: number;
  skill_tags: string[] | null;
  video_url: string;
};

type AttemptRow = {
  id: string;
  attempt_number: number;
  final_score: number;
  approved: boolean;
  completed_at: string;
};

type QuizRow = {
  question_id: string;
  question_prompt: string;
  question_position: number;
  option_id: string;
  option_text: string;
  option_position: number;
};

export default async function ProfessionalCourseDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const { id } = await params;
  const queryParams = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: professional } = userData.user ? await supabase.from("professionals").select("id").eq("user_id", userData.user.id).maybeSingle() : { data: null };

  const [{ data: course }, { data: attempts }, { data: quizRows }] = await Promise.all([
    supabase.from("courses").select("id,title,description,category,workload_hours,skill_tags,video_url").eq("id", id).eq("status", "published").maybeSingle(),
    professional?.id ? supabase.from("course_attempts").select("id,attempt_number,final_score,approved,completed_at").eq("course_id", id).eq("professional_id", professional.id).order("attempt_number", { ascending: true }) : Promise.resolve({ data: [] }),
    supabase.rpc("get_published_course_quiz", { target_course_id: id })
  ]);

  if (!course) notFound();
  const typedCourse = course as CourseRow;
  const typedAttempts = (attempts ?? []) as AttemptRow[];
  const approved = typedAttempts.some((attempt) => attempt.approved);
  const lastAttempt = typedAttempts.at(-1);

  return (
    <AppShell eyebrow="Profissional" title={typedCourse.title}>
      <div className="space-y-5">
        <Link href="/professional/courses" className="text-sm font-semibold text-blue-700">← Voltar para cursos</Link>
        {queryParams.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir: {queryParams.error}</p> : null}
        {queryParams.message ? (
          <p className={`rounded-md border p-3 text-sm ${queryParams.message === "aprovado" ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            {queryParams.message === "aprovado" ? "Parabéns! Você foi aprovado e sua certificação foi adicionada ao perfil." : queryParams.message === "reprovado-final" ? "Você não atingiu a nota mínima na segunda tentativa. O curso foi encerrado para você." : "Você não atingiu a nota mínima. A segunda tentativa está liberada."}
          </p>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#F2811D]">{typedCourse.category} · {typedCourse.workload_hours}h</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[#0F2D4E]">{typedCourse.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{typedCourse.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(typedCourse.skill_tags ?? []).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tag}</span>)}
          </div>
          {lastAttempt ? (
            <div className={`mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold ${lastAttempt.approved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {lastAttempt.approved ? <CheckCircle2 aria-hidden="true" size={17} /> : <XCircle aria-hidden="true" size={17} />}
              Última nota: {Number(lastAttempt.final_score).toFixed(0)}% · tentativa {lastAttempt.attempt_number}
            </div>
          ) : null}
        </section>

        <CourseQuizPanel
          courseId={typedCourse.id}
          videoUrl={typedCourse.video_url}
          quizRows={(quizRows ?? []) as QuizRow[]}
          attemptsUsed={typedAttempts.length}
          approved={approved}
        />
      </div>
    </AppShell>
  );
}
