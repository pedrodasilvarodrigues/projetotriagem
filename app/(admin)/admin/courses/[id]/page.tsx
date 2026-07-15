import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
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
  video_url: string;
  status: string;
};

type QuestionRow = {
  id: string;
  prompt: string;
  position: number;
  options: Array<{ id: string; option_text: string; is_correct: boolean; position: number }>;
};

type AttemptRow = {
  id: string;
  course_id: string;
  professional_id: string;
  attempt_number: number;
  final_score: number;
  approved: boolean;
  completed_at: string;
  professional: { full_name: string; email: string | null; desired_role: string | null } | { full_name: string; email: string | null; desired_role: string | null }[] | null;
};

type AnswerRow = {
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  correct_option_id: string | null;
  is_correct: boolean;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCourseDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string; q?: string }> }) {
  const { id } = await params;
  const queryParams = await searchParams;
  const supabase = await createServerClient();

  const [{ data: course }, { data: questions }, { data: attempts }, { data: answers }, { count: attemptsCount }] = await Promise.all([
    supabase.from("courses").select("id,title,description,category,workload_hours,skill_tags,video_url,status").eq("id", id).maybeSingle(),
    supabase.from("course_quiz_questions").select("id,prompt,position,options:course_quiz_options(id,option_text,is_correct,position)").eq("course_id", id).order("position", { ascending: true }),
    supabase.from("course_attempts").select("id,course_id,professional_id,attempt_number,final_score,approved,completed_at,professional:professionals(full_name,email,desired_role)").eq("course_id", id).order("completed_at", { ascending: false }).limit(200),
    supabase.from("course_attempt_answers").select("attempt_id,question_id,selected_option_id,correct_option_id,is_correct"),
    supabase.from("course_attempts").select("id", { count: "exact", head: true }).eq("course_id", id)
  ]);

  if (!course) notFound();
  const typedCourse = course as CourseRow;
  const typedQuestions = ((questions ?? []) as unknown as QuestionRow[]).map((question) => ({ ...question, options: [...(question.options ?? [])].sort((a, b) => a.position - b.position) }));
  const filteredAttempts = ((attempts ?? []) as unknown as AttemptRow[]).filter((attempt) => {
    if (!queryParams.q) return true;
    const professional = one(attempt.professional);
    const q = queryParams.q.toLowerCase();
    return professional?.full_name?.toLowerCase().includes(q) || professional?.email?.toLowerCase().includes(q);
  });
  const answersByAttempt = new Map<string, AnswerRow[]>();
  ((answers ?? []) as AnswerRow[]).forEach((answer) => {
    const current = answersByAttempt.get(answer.attempt_id) ?? [];
    current.push(answer);
    answersByAttempt.set(answer.attempt_id, current);
  });

  return (
    <AppShell eyebrow="Administrador" title={`Curso: ${typedCourse.title}`}>
      <div className="space-y-5">
        {queryParams.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir: {queryParams.error}</p> : null}
        {queryParams.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Operação realizada.</p> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin/courses" className="text-sm font-semibold text-blue-700">← Voltar para cursos</Link>
              <p className="mt-2 text-sm text-slate-600">{Number(attemptsCount ?? 0) > 0 ? "A prova está bloqueada para edição porque já existem tentativas registradas." : "Você ainda pode editar a prova deste curso."}</p>
            </div>
            <form action={deleteCourseAction}>
              <input type="hidden" name="courseId" value={typedCourse.id} />
              <button className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">Excluir / arquivar</button>
            </form>
          </div>
          <CourseForm course={typedCourse} questions={typedQuestions} lockedQuiz={Number(attemptsCount ?? 0) > 0} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0F2D4E]">Resultados da prova</h2>
              <p className="mt-1 text-sm text-slate-600">Detalhe tentativa por tentativa, com resposta escolhida e resposta correta.</p>
            </div>
            <form action={`/admin/courses/${typedCourse.id}`} className="flex gap-2">
              <input name="q" defaultValue={queryParams.q ?? ""} className="field-input" placeholder="Buscar profissional" />
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Buscar</button>
            </form>
          </div>

          <div className="mt-5 space-y-4">
            {filteredAttempts.map((attempt) => {
              const professional = one(attempt.professional);
              const attemptAnswers = answersByAttempt.get(attempt.id) ?? [];
              return (
                <details key={attempt.id} className="rounded-2xl border border-slate-200 bg-slate-50">
                  <summary className="cursor-pointer p-4">
                    <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        <strong className="text-[#0F2D4E]">{professional?.full_name ?? "Profissional"}</strong>
                        <span className="block text-xs text-slate-500">{professional?.email ?? "Email não informado"} · tentativa {attempt.attempt_number} · {new Date(attempt.completed_at).toLocaleString("pt-BR")}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${attempt.approved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {attempt.approved ? <CheckCircle2 aria-hidden="true" size={14} /> : <XCircle aria-hidden="true" size={14} />}
                        {Number(attempt.final_score).toFixed(0)}% · {attempt.approved ? "Aprovado" : "Reprovado"}
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-slate-200 p-4">
                    <div className="grid gap-3">
                      {typedQuestions.map((question) => {
                        const answer = attemptAnswers.find((item) => item.question_id === question.id);
                        const selected = question.options.find((option) => option.id === answer?.selected_option_id);
                        const correct = question.options.find((option) => option.id === answer?.correct_option_id || option.is_correct);
                        return (
                          <div key={question.id} className="rounded-xl bg-white p-4 text-sm">
                            <p className="font-semibold text-slate-950">{question.prompt}</p>
                            <p className="mt-2 text-slate-600">Escolhida: <strong>{selected?.option_text ?? "Sem resposta"}</strong></p>
                            <p className="mt-1 text-slate-600">Correta: <strong>{correct?.option_text ?? "Não identificada"}</strong></p>
                            <p className={`mt-2 text-xs font-bold ${answer?.is_correct ? "text-green-700" : "text-red-700"}`}>{answer?.is_correct ? "Acertou" : "Errou"}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
            {filteredAttempts.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhuma tentativa encontrada para este curso.</p> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
