"use client";

import { useMemo, useState } from "react";
import { PlayCircle, ShieldCheck } from "lucide-react";
import { submitCourseAttemptAction } from "@/lib/actions/courses";
import { COURSE_MAX_ATTEMPTS } from "@/lib/courses/config";

type QuizRow = {
  question_id: string;
  question_prompt: string;
  question_position: number;
  option_id: string;
  option_text: string;
  option_position: number;
};

type CourseQuizPanelProps = {
  courseId: string;
  videoUrl: string;
  quizRows: QuizRow[];
  attemptsUsed: number;
  approved: boolean;
};

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

export function CourseQuizPanel({ courseId, videoUrl, quizRows, attemptsUsed, approved }: CourseQuizPanelProps) {
  const [videoReady, setVideoReady] = useState(false);
  const groupedQuestions = useMemo(() => {
    const map = new Map<string, { id: string; prompt: string; position: number; options: Array<{ id: string; text: string; position: number }> }>();
    quizRows.forEach((row) => {
      const current = map.get(row.question_id) ?? { id: row.question_id, prompt: row.question_prompt, position: row.question_position, options: [] };
      current.options.push({ id: row.option_id, text: row.option_text, position: row.option_position });
      map.set(row.question_id, current);
    });
    return [...map.values()].sort((a, b) => a.position - b.position).map((question) => ({ ...question, options: question.options.sort((a, b) => a.position - b.position) }));
  }, [quizRows]);

  const attemptsRemaining = Math.max(0, COURSE_MAX_ATTEMPTS - attemptsUsed);
  const canAnswer = videoReady && !approved && attemptsRemaining > 0 && groupedQuestions.length > 0;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <PlayCircle aria-hidden="true" className="mt-1 text-[#F2811D]" size={24} />
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F2D4E]">Assista ao vídeo antes da prova</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">A prova só é liberada após marcar o vídeo como concluído. Você terá até {COURSE_MAX_ATTEMPTS} tentativas.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
          {isDirectVideo(videoUrl) ? (
            <video src={videoUrl} controls className="aspect-video w-full" onEnded={() => setVideoReady(true)} />
          ) : (
            <iframe src={videoUrl} title="Vídeo do curso" className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          )}
        </div>
        {!isDirectVideo(videoUrl) ? (
          <button type="button" onClick={() => setVideoReady(true)} className="mt-4 rounded-xl bg-[#0F2D4E] px-4 py-2 text-sm font-semibold text-white">
            Confirmo que assisti ao vídeo
          </button>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 rounded-2xl border border-[#F2811D]/20 bg-[#F2811D]/10 p-4 text-sm leading-6 text-slate-700">
          <strong className="block text-[#0F2D4E]">Aviso importante</strong>
          Você terá até {COURSE_MAX_ATTEMPTS} tentativas. Após a segunda, não será possível refazer este curso. O envio da prova é único e definitivo.
        </div>

        {approved ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
            <ShieldCheck aria-hidden="true" className="mb-2" size={24} />
            Você já foi aprovado neste curso. A certificação foi adicionada ao seu perfil.
          </div>
        ) : attemptsRemaining <= 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            Você usou as duas tentativas. Este curso está encerrado para você.
          </div>
        ) : (
          <form action={submitCourseAttemptAction} className="space-y-5">
            <input type="hidden" name="courseId" value={courseId} />
            {groupedQuestions.map((question, index) => (
              <fieldset key={question.id} disabled={!canAnswer} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 disabled:opacity-60">
                <legend className="px-1 text-sm font-bold text-[#0F2D4E]">Pergunta {index + 1}</legend>
                <p className="mt-2 text-sm font-semibold text-slate-900">{question.prompt}</p>
                <div className="mt-3 grid gap-2">
                  {question.options.map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:border-[#F2811D]/40">
                      <input required type="radio" name={`question_${question.id}`} value={option.id} />
                      {option.text}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button disabled={!canAnswer} className="btn-primary rounded-xl px-5 py-3 text-sm disabled:opacity-50" type="submit">
              Enviar tentativa {attemptsUsed + 1}
            </button>
            {!videoReady ? <p className="text-sm text-slate-500">Assista ao vídeo e confirme a conclusão para liberar a prova.</p> : null}
          </form>
        )}
      </section>
    </div>
  );
}
