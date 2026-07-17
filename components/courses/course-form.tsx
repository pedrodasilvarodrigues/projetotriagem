"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveCourseAction } from "@/lib/actions/courses";

type QuestionDraft = {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
};

type CourseFormProps = {
  course?: {
    id: string;
    title: string;
    description: string;
    category: string;
    workload_hours: number;
    skill_tags: string[] | null;
    video_url: string;
    status: string;
  };
  questions?: Array<{
    id: string;
    prompt: string;
    options: Array<{ option_text: string; is_correct: boolean; position: number }>;
  }>;
  lockedQuiz?: boolean;
};

type ExistingQuestion = NonNullable<CourseFormProps["questions"]>[number];

function questionFromExisting(question?: ExistingQuestion, index = 0): QuestionDraft {
  const sortedOptions = [...(question?.options ?? [])].sort((a, b) => a.position - b.position);
  return {
    id: question?.id ?? `new-${Date.now()}-${index}`,
    prompt: question?.prompt ?? "",
    options: [sortedOptions[0]?.option_text ?? "", sortedOptions[1]?.option_text ?? "", sortedOptions[2]?.option_text ?? "", sortedOptions[3]?.option_text ?? ""],
    correctIndex: Math.max(0, sortedOptions.findIndex((option) => option.is_correct))
  };
}

export function CourseForm({ course, questions = [], lockedQuiz = false }: CourseFormProps) {
  const [drafts, setDrafts] = useState<QuestionDraft[]>(questions.length > 0 ? questions.map(questionFromExisting) : [questionFromExisting(undefined, 0)]);

  function addQuestion() {
    setDrafts((current) => [...current, questionFromExisting(undefined, current.length)]);
  }

  function removeQuestion(id: string) {
    setDrafts((current) => current.length <= 1 ? current : current.filter((question) => question.id !== id));
  }

  function updateQuestion(id: string, patch: Partial<QuestionDraft>) {
    setDrafts((current) => current.map((question) => question.id === id ? { ...question, ...patch } : question));
  }

  return (
    <form action={saveCourseAction} className="space-y-5">
      <input type="hidden" name="courseId" value={course?.id ?? ""} />
      <input type="hidden" name="redirectTo" value={course?.id ? `/admin/courses/${course.id}` : "/admin/courses"} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Título do curso<input name="title" required defaultValue={course?.title ?? ""} className="field-input mt-2" /></label>
        <label className="text-sm font-semibold">Área / categoria<input name="category" required defaultValue={course?.category ?? ""} className="field-input mt-2" placeholder="Ex: Atendimento, Segurança, Logística" /></label>
        <label className="text-sm font-semibold">Carga horária<input name="workloadHours" type="number" min="1" required defaultValue={course?.workload_hours ?? 1} className="field-input mt-2" /></label>
        <label className="text-sm font-semibold">Situação
          <select name="status" defaultValue={course?.status ?? "draft"} className="field-input mt-2">
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </label>
        <label className="text-sm font-semibold md:col-span-2">Tags de habilidade<input name="skillTags" defaultValue={(course?.skill_tags ?? []).join(", ")} className="field-input mt-2" placeholder="Ex: atendimento, excel, segurança do trabalho" /></label>
        <label className="text-sm font-semibold md:col-span-2">Link do vídeo<input name="videoUrl" required defaultValue={course?.video_url ?? ""} className="field-input mt-2" placeholder="YouTube ou arquivo MP4/WEBM/OGG" /><span className="mt-1 block text-xs font-normal text-slate-500">O progresso é validado automaticamente e a prova é liberada ao atingir 90%.</span></label>
        <label className="text-sm font-semibold md:col-span-2">Descrição<textarea name="description" required defaultValue={course?.description ?? ""} className="field-input mt-2 min-h-28" /></label>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-[#0F2D4E]">Construtor de prova</h3>
            <p className="mt-1 text-sm text-slate-600">
              {lockedQuiz ? "Este curso já possui tentativas. A prova fica bloqueada para preservar o histórico." : "Crie perguntas de múltipla escolha e marque a alternativa correta."}
            </p>
          </div>
          {!lockedQuiz ? (
            <button type="button" onClick={addQuestion} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2D4E] px-4 py-2 text-sm font-semibold text-white">
              <Plus aria-hidden="true" size={16} />
              Adicionar pergunta
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          {drafts.map((question, questionIndex) => (
            <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-[#0F2D4E]">Pergunta {questionIndex + 1}</strong>
                {!lockedQuiz ? (
                  <button type="button" onClick={() => removeQuestion(question.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700">
                    <Trash2 aria-hidden="true" size={13} />
                    Remover
                  </button>
                ) : null}
              </div>
              <input type="hidden" name="correctIndex" value={question.correctIndex} />
              <label className="mt-3 block text-sm font-semibold">Enunciado
                <textarea
                  name="questionPrompt"
                  value={question.prompt}
                  disabled={lockedQuiz}
                  onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
                  className="field-input mt-2 min-h-20"
                />
              </label>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="text-sm font-semibold">
                    Alternativa {String.fromCharCode(65 + optionIndex)}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctIndex === optionIndex}
                        disabled={lockedQuiz}
                        onChange={() => updateQuestion(question.id, { correctIndex: optionIndex })}
                      />
                      <input
                        name={["optionA", "optionB", "optionC", "optionD"][optionIndex]}
                        value={option}
                        disabled={lockedQuiz}
                        onChange={(event) => {
                          const next = [...question.options] as QuestionDraft["options"];
                          next[optionIndex] = event.target.value;
                          updateQuestion(question.id, { options: next });
                        }}
                        className="field-input"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <button className="btn-primary rounded-xl px-5 py-3 text-sm" type="submit">Salvar curso</button>
    </form>
  );
}
