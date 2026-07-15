import { AppShell } from "@/components/app/shell";
import { routeProfessionalToDemandAction, updateAdminDemandStatusAction } from "@/lib/actions/workspace";
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
  required_courses: string[] | null;
  required_certifications: string[] | null;
  internal_notes: string | null;
  company: { trade_name: string } | { trade_name: string }[] | null;
};

type CandidateScore = {
  id?: string;
  demand_id: string;
  professional_id: string;
  total_score: number | null;
  education_score: number | null;
  experience_score: number | null;
  technical_score: number | null;
  location_score: number | null;
  certification_bonus_score?: number | null;
  professional:
    | {
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        desired_role: string | null;
        city: string | null;
        state: string | null;
        status: string | null;
        deleted_at: string | null;
      }
    | Array<{
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        desired_role: string | null;
        city: string | null;
        state: string | null;
        status: string | null;
        deleted_at: string | null;
      }>
    | null;
};

type ProcessRow = {
  id: string;
  demand_id: string;
  professional_id: string;
  status: string;
};

type CertificationRow = {
  id: string;
  course_id: string;
  professional_id: string;
  attempt_id: string | null;
  score: number;
  approved_at: string;
  course: { title: string; category: string; skill_tags: string[] | null } | { title: string; category: string; skill_tags: string[] | null }[] | null;
};

type AttemptAnswerRow = {
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  correct_option_id: string | null;
  is_correct: boolean;
};

type QuestionRow = { id: string; prompt: string };
type OptionRow = { id: string; option_text: string };

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    forwarded: "apresentado",
    waiting: "na fila",
    interview: "entrevista",
    hired: "contratado",
    rejected: "reprovado",
    screening: "triagem",
    analysis: "analise",
    received: "recebido",
    pre_approved: "pre-aprovado",
    training: "treinamento",
    active: "aberta",
    draft: "rascunho",
    closed: "encerrada",
    cancelled: "arquivada"
  };
  return status ? labels[status] ?? status : null;
}

function normalize(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default async function AdminDemandsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  let query = supabase
    .from("demands")
    .select("id,title,description,openings,status,city,state,salary_min,salary_max,minimum_experience_months,education_minimum,technical_skills,required_courses,required_certifications,internal_notes,company:companies(trade_name)")
    .order("created_at", { ascending: false })
    .limit(80);

  if (params.status) query = query.eq("status", params.status);
  if (params.q) query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,city.ilike.%${params.q}%`);

  const [{ data: demands }, { data: processes }, { data: scores }, { data: certifications }, { data: attemptAnswers }, { data: quizQuestions }, { data: quizOptions }] = await Promise.all([
    query,
    supabase.from("screening_processes").select("id,demand_id,professional_id,status").limit(1200),
    supabase
      .from("compatibility_scores")
      .select("id,demand_id,professional_id,total_score,education_score,experience_score,technical_score,location_score,certification_bonus_score,professional:professionals(id,full_name,email,phone,desired_role,city,state,status,deleted_at)")
      .order("total_score", { ascending: false })
      .limit(2000),
    supabase.from("professional_certifications").select("id,course_id,professional_id,attempt_id,score,approved_at,course:courses(title,category,skill_tags)").limit(2000),
    supabase.from("course_attempt_answers").select("attempt_id,question_id,selected_option_id,correct_option_id,is_correct").limit(5000),
    supabase.from("course_quiz_questions").select("id,prompt").limit(5000),
    supabase.from("course_quiz_options").select("id,option_text").limit(10000)
  ]);

  const { data: professionalsWithoutScoreFallback } = await supabase
    .from("professionals")
    .select("id,full_name,email,phone,desired_role,city,state,status,deleted_at")
    .is("deleted_at", null)
    .neq("status", "suspended")
    .neq("status", "rejected")
    .order("updated_at", { ascending: false })
    .limit(300);

  const certificationsByProfessional = new Map<string, CertificationRow[]>();
  ((certifications ?? []) as unknown as CertificationRow[]).forEach((certification) => {
    const current = certificationsByProfessional.get(certification.professional_id) ?? [];
    current.push(certification);
    certificationsByProfessional.set(certification.professional_id, current);
  });

  const answersByAttempt = new Map<string, AttemptAnswerRow[]>();
  ((attemptAnswers ?? []) as AttemptAnswerRow[]).forEach((answer) => {
    const current = answersByAttempt.get(answer.attempt_id) ?? [];
    current.push(answer);
    answersByAttempt.set(answer.attempt_id, current);
  });

  const questionById = new Map(((quizQuestions ?? []) as QuestionRow[]).map((question) => [question.id, question]));
  const optionById = new Map(((quizOptions ?? []) as OptionRow[]).map((option) => [option.id, option]));

  return (
    <AppShell eyebrow="Administrador" title="Demandas">
      <div className="space-y-5">
        {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Não foi possível concluir: {params.error}</p> : null}
        {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Operação realizada.</p> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-end">
            <div>
              <h2 className="text-lg font-semibold">Demandas cadastradas pelas empresas</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                O administrador não cria demandas. Aqui ele acompanha demandas existentes, controla status e apresenta profissionais por ordem de compatibilidade.
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]" action="/admin/demands">
              <input name="q" defaultValue={params.q ?? ""} className="field-input" placeholder="Buscar cargo, cidade ou requisito" />
              <select name="status" defaultValue={params.status ?? ""} className="field-input">
                <option value="">Todos</option>
                <option value="draft">Rascunho</option>
                <option value="active">Aberta</option>
                <option value="screening">Em triagem</option>
                <option value="closed">Encerrada</option>
                <option value="cancelled">Arquivada</option>
              </select>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
            </form>
          </div>
        </section>

        <section id="apresentar" className="scroll-mt-24 space-y-4">
          {((demands ?? []) as unknown as DemandRow[]).map((demand) => {
            const linked = ((processes ?? []) as ProcessRow[]).filter((process) => process.demand_id === demand.id);
            const processByProfessional = new Map(linked.map((process) => [process.professional_id, process]));
            const scoredCandidates = ((scores ?? []) as unknown as CandidateScore[])
              .filter((score) => score.demand_id === demand.id)
              .filter((score) => {
                const professional = one(score.professional);
                return professional && !professional.deleted_at && professional.status !== "suspended" && professional.status !== "rejected";
              });
            const scoredProfessionalIds = new Set(scoredCandidates.map((score) => score.professional_id));
            const fallbackCandidates = (professionalsWithoutScoreFallback ?? [])
              .filter((professional) => !scoredProfessionalIds.has(professional.id))
              .map((professional) => ({
                demand_id: demand.id,
                professional_id: professional.id,
                total_score: null,
                education_score: null,
                experience_score: null,
                technical_score: null,
                location_score: null,
                certification_bonus_score: null,
                professional
              } satisfies CandidateScore));
            const demandScores = [...scoredCandidates, ...fallbackCandidates].slice(0, 100);
            const demandTags = new Set([...(demand.technical_skills ?? []), ...(demand.required_courses ?? []), ...(demand.required_certifications ?? [])].map((tag) => normalize(tag)));

            return (
              <article key={demand.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#38506f]">{one(demand.company)?.trade_name ?? "Empresa não informada"}</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">{demand.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{demand.city}/{demand.state} · {demand.openings} vaga(s) · situação: {statusLabel(demand.status)}</p>
                    <p className="mt-2 text-sm text-slate-600">Salário: {demand.salary_min ?? "-"} a {demand.salary_max ?? "-"}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{demand.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded bg-slate-100 px-2 py-1">Escolaridade: {demand.education_minimum}</span>
                      <span className="rounded bg-slate-100 px-2 py-1">Experiência: {demand.minimum_experience_months} meses</span>
                      <span className="rounded bg-slate-100 px-2 py-1">{(demand.technical_skills ?? []).join(", ") || "Sem requisitos listados"}</span>
                    </div>
                  </div>

                  <div className="grid gap-2 content-start">
                    <form action={updateAdminDemandStatusAction} className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-3">
                      <input type="hidden" name="demandId" value={demand.id} />
                      <input type="hidden" name="redirectTo" value="/admin/demands" />
                      <select name="status" defaultValue={demand.status} className="rounded border border-slate-300 px-2 py-2 text-xs">
                        <option value="active">Reabrir / aberta</option>
                        <option value="screening">Em triagem</option>
                        <option value="closed">Encerrar</option>
                        <option value="cancelled">Arquivar</option>
                      </select>
                      <button className="rounded bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Salvar status</button>
                    </form>
                    <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                      <strong>{linked.length}</strong>
                      <p className="text-xs text-slate-500">profissionais vinculados</p>
                    </div>
                  </div>
                </div>

                <details className="mt-4 rounded border border-blue-100 bg-blue-50/60">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-blue-900">Apresentar candidato por compatibilidade</summary>
                  <div className="border-t border-blue-100 p-3 sm:p-4">
                    {demandScores.length > 0 ? (
                      <div className="grid gap-3">
                        {demandScores.map((score, index) => {
                          const professional = one(score.professional);
                          if (!professional) return null;
                          const currentProcess = processByProfessional.get(professional.id);
                          const currentStatus = statusLabel(currentProcess?.status);
                          const redirectTo = `/admin/demands#apresentar`;
                          const hasScore = score.total_score !== null;
                          const relevantCertifications = (certificationsByProfessional.get(professional.id) ?? []).filter((certification) => {
                            const course = one(certification.course);
                            return (course?.skill_tags ?? []).some((tag) => demandTags.has(normalize(tag)));
                          });

                          return (
                            <div key={`${demand.id}-${professional.id}`} className="grid gap-3 rounded border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1fr)_120px_220px] md:items-center">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">#{index + 1} mais compatível</p>
                                <h3 className="font-semibold text-slate-950">{professional.full_name}</h3>
                                <p className="text-xs text-slate-500">{professional.desired_role ?? "Cargo não informado"} · {professional.city ?? "-"}/{professional.state ?? "-"}</p>
                                <p className="text-xs text-slate-500">{professional.email ?? "Email não informado"} · {professional.phone ?? "Telefone não informado"}</p>
                                {currentStatus ? <p className="mt-2 text-xs font-semibold text-blue-700">Já está {currentStatus} nesta demanda.</p> : null}
                                {relevantCertifications.length > 0 ? (
                                  <details className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
                                    <summary className="cursor-pointer text-xs font-bold text-green-800">
                                      {professional.full_name} concluiu {relevantCertifications.length} curso(s) relevante(s)
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                      {relevantCertifications.map((certification) => {
                                        const course = one(certification.course);
                                        const answers = certification.attempt_id ? answersByAttempt.get(certification.attempt_id) ?? [] : [];
                                        return (
                                          <div key={certification.id} className="rounded-lg bg-white p-3 text-xs text-slate-700">
                                            <p className="font-bold text-[#0F2D4E]">{course?.title ?? "Curso concluído"} — aprovado com {Number(certification.score).toFixed(0)}%</p>
                                            <p className="mt-1 text-slate-500">Área: {course?.category ?? "-"} · {new Date(certification.approved_at).toLocaleDateString("pt-BR")}</p>
                                            {answers.length > 0 ? (
                                              <div className="mt-2 grid gap-2">
                                                {answers.map((answer) => (
                                                  <div key={`${certification.id}-${answer.question_id}`} className="rounded bg-slate-50 p-2">
                                                    <p className="font-semibold">{questionById.get(answer.question_id)?.prompt ?? "Pergunta"}</p>
                                                    <p>Escolhida: {optionById.get(answer.selected_option_id ?? "")?.option_text ?? "Sem resposta"}</p>
                                                    <p>Correta: {optionById.get(answer.correct_option_id ?? "")?.option_text ?? "Não identificada"}</p>
                                                    <p className={answer.is_correct ? "font-bold text-green-700" : "font-bold text-red-700"}>{answer.is_correct ? "Acertou" : "Errou"}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </details>
                                ) : null}
                              </div>
                              <div>
                                <strong className="block text-2xl text-[#18212f]">{hasScore ? `${Number(score.total_score).toFixed(0)}%` : "Pendente"}</strong>
                                <p className="text-xs text-slate-500">compatibilidade</p>
                                <p className="mt-1 text-[0.7rem] text-slate-500">
                                  {hasScore ? `Téc. ${Number(score.technical_score).toFixed(0)} · Exp. ${Number(score.experience_score).toFixed(0)} · Local ${Number(score.location_score).toFixed(0)}` : "Sem pontuação calculada ainda"}
                                </p>
                                {Number(score.certification_bonus_score ?? 0) > 0 ? <p className="mt-1 text-[0.7rem] font-bold text-green-700">Bônus cursos: +{Number(score.certification_bonus_score).toFixed(0)}</p> : null}
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                                <form action={routeProfessionalToDemandAction}>
                                  <input type="hidden" name="demandId" value={demand.id} />
                                  <input type="hidden" name="professionalId" value={professional.id} />
                                  <input type="hidden" name="mode" value="present" />
                                  <input type="hidden" name="redirectTo" value={redirectTo} />
                                  <button className="w-full rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white">Apresentar profissional</button>
                                </form>
                                <form action={routeProfessionalToDemandAction}>
                                  <input type="hidden" name="demandId" value={demand.id} />
                                  <input type="hidden" name="professionalId" value={professional.id} />
                                  <input type="hidden" name="mode" value="queue" />
                                  <input type="hidden" name="redirectTo" value={redirectTo} />
                                  <button className="w-full rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white">Colocar na fila</button>
                                </form>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="rounded border border-slate-200 bg-white p-3 text-sm text-slate-600">
                        Nenhum profissional compatível calculado para está demanda ainda. Quando o motor de compatibilidade gerar pontuacoes, eles aparecerao aqui em ordem.
                      </p>
                    )}
                  </div>
                </details>
              </article>
            );
          })}
          {(demands ?? []).length === 0 ? <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">Nenhuma demanda encontrada.</section> : null}
        </section>
      </div>
    </AppShell>
  );
}
