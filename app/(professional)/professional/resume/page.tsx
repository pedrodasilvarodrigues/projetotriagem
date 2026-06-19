import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, FileText, GraduationCap, Languages, Plus, ShieldCheck, Sparkles, Target, Upload } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { DateTextInput } from "@/components/forms/date-text-input";
import { InstitutionAutocomplete } from "@/components/forms/institution-autocomplete";
import { ResumeDownloadCustomizer } from "@/components/professional/resume-download-customizer";
import { PersonalDataFields } from "@/components/professional/personal-data-fields";
import { ResumeSectionNav } from "@/components/professional/resume-section-nav";
import {
  addProfessionalCourseAction,
  addProfessionalEducationAction,
  addProfessionalExperienceAction,
  addProfessionalLanguageAction,
  addProfessionalSkillAction,
  updateResumePersonalAction,
  updateResumeProfileAction,
  updateUserSettingsAction,
  uploadProfessionalResumeAction
} from "@/lib/actions/workspace";
import { createServerClient } from "@/lib/supabase/server";

type VersionRow = { id: string; version: number; storage_path: string; generated_at: string };
type CourseRow = { id: string; name: string; institution: string | null; workload_hours: number | null; completed_at: string | null };
type ExperienceRow = { id: string; company_name: string; role_title: string; description: string; started_at: string; ended_at: string | null; is_current: boolean };
type EducationRow = { id: string; level: string; institution: string; course_name: string; completed_at: string | null };
type LanguageRow = { id: string; language_name: string; proficiency: string };
type SkillRow = { id: string; name: string; skill_type: string; proficiency: number | null };

const personalErrorMessages: Record<string, string> = {
  "firstName-invalido": "Informe o nome.",
  "lastName-invalido": "Informe o sobrenome.",
  "nationality-invalido": "Informe a nacionalidade.",
  "cpf-invalido": "Confira o CPF informado.",
  "cpf-ja-cadastrado": "Este CPF já pertence a outro cadastro.",
  "data-invalida": "Informe uma data valida no formato dd/mm/aaaa.",
  "idade-minima": "O cadastro profissional exige idade mínima de 14 anos.",
  "telefone-invalido": "Informe um telefone com DDD.",
  "email-invalido": "Confira o email informado.",
  "cep-invalido": "Informe um CEP com 8 digitos.",
  "city-invalido": "Informe a cidade.",
  "state-invalido": "Informe o estado com duas letras.",
  "estado-invalido": "Informe o estado com duas letras.",
  "erro-ao-salvar-perfil": "Não foi possível salvar os dados gerais. Tente novamente.",
  "erro-ao-salvar-profissional": "Não foi possível salvar os dados profissionais. Tente novamente.",
  "erro-ao-salvar-formacao": "Não foi possível salvar a formação. Tente novamente.",
  "erro-ao-salvar-curso": "Não foi possível salvar o curso. Tente novamente.",
  "erro-ao-salvar-idioma": "Não foi possível salvar o idioma. Tente novamente.",
  "erro-ao-salvar-habilidade": "Não foi possível salvar a habilidade. Tente novamente.",
  "erro-ao-salvar-experiencia": "Não foi possível salvar a experiência. Tente novamente.",
  "perfil-profissional-indisponivel": "Não foi possível carregar seu perfil para salvar. Atualize a página e tente novamente."
};

const educationOptions = [
  ["fundamental", "Fundamental"],
  ["medio", "Medio"],
  ["tecnico", "Técnico"],
  ["superior", "Superior"],
  ["pos", "Pos-graduacao"],
  ["mba", "MBA"],
  ["mestrado", "Mestrado"],
  ["doutorado", "Doutorado"]
];

const sections: Array<[string, string]> = [
  ["dados-pessoais", "Dados pessoais"],
  ["confidencialidade", "Segurança"],
  ["objetivo", "Objetivo"],
  ["formacao", "Histórico acadêmico"],
  ["experiencias", "Experiências"],
  ["cursos", "Cursos"],
  ["idiomas", "Idiomas"],
  ["habilidades", "Habilidades"],
  ["documento", "Documento"]
];

function dateLabel(value?: string | null) {
  if (!value) return "Atual";
  return new Date(value).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

function splitName(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

export default async function ProfessionalResumePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: professional } = await supabase
    .from("professionals")
    .select("id,full_name,desired_role,summary,education_level,city,state,available_in_days,email,phone,cpf,birth_date,nationality,cep,street,address_number,neighborhood")
    .eq("user_id", userData.user?.id)
    .maybeSingle();
  const { data: resume } = professional?.id ? await supabase.from("resumes").select("id,active_version_id").eq("professional_id", professional.id).maybeSingle() : { data: null };

  const [{ data: versions }, { data: courses }, { data: experiences }, { data: educations }, { data: languages }, { data: skills }, { data: settings }] = professional?.id
    ? await Promise.all([
        resume?.id ? supabase.from("resume_versions").select("id,version,storage_path,generated_at").eq("resume_id", resume.id).order("version", { ascending: false }) : Promise.resolve({ data: [] }),
        supabase.from("professional_courses").select("id,name,institution,workload_hours,completed_at").eq("professional_id", professional.id).order("created_at", { ascending: false }),
        supabase.from("professional_experiences").select("id,company_name,role_title,description,started_at,ended_at,is_current").eq("professional_id", professional.id).order("started_at", { ascending: false }),
        supabase.from("professional_educations").select("id,level,institution,course_name,completed_at").eq("professional_id", professional.id).order("created_at", { ascending: false }),
        supabase.from("professional_languages").select("id,language_name,proficiency").eq("professional_id", professional.id).order("created_at", { ascending: false }),
        supabase.from("professional_skills").select("id,name,skill_type,proficiency").eq("professional_id", professional.id).order("created_at", { ascending: false }),
        supabase.from("user_settings").select("email_notifications,opportunity_alerts,profile_visible,allow_recruiter_contact,show_salary_expectation").eq("user_id", userData.user?.id).maybeSingle()
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: null }];

  const activeVersion = ((versions ?? []) as VersionRow[]).find((version) => version.id === resume?.active_version_id) ?? ((versions ?? []) as VersionRow[])[0];
  const { data: documentUrl } = activeVersion?.storage_path ? await supabase.storage.from("curriculums").createSignedUrl(activeVersion.storage_path, 60 * 60) : { data: null };
  const isPdf = activeVersion?.storage_path?.toLowerCase().endsWith(".pdf");
  const nameParts = splitName(professional?.full_name);
  const prefs = {
    email_notifications: settings?.email_notifications ?? true,
    opportunity_alerts: settings?.opportunity_alerts ?? true,
    profile_visible: settings?.profile_visible ?? true,
    allow_recruiter_contact: settings?.allow_recruiter_contact ?? true,
    show_salary_expectation: settings?.show_salary_expectation ?? false
  };
  const resumeChecklist = [
    { label: "Dados pessoais", done: Boolean(professional?.full_name && professional?.email && professional?.phone && professional?.city && professional?.state), href: "#dados-pessoais" },
    { label: "Objetivo e resumo", done: Boolean(professional?.desired_role && professional?.summary), href: "#objetivo" },
    { label: "Histórico acadêmico", done: (educations ?? []).length > 0, href: "#formacao" },
    { label: "Experiências", done: (experiences ?? []).length > 0, href: "#experiencias" },
    { label: "Cursos", done: (courses ?? []).length > 0, href: "#cursos" },
    { label: "Idiomas", done: (languages ?? []).length > 0, href: "#idiomas" },
    { label: "Habilidades", done: (skills ?? []).length > 0, href: "#habilidades" },
    { label: "Documento anexado", done: Boolean(activeVersion), href: "#documento" }
  ];
  const resumeCompletion = Math.round((resumeChecklist.filter((item) => item.done).length / resumeChecklist.length) * 100);
  const nextResumeActions = resumeChecklist.filter((item) => !item.done).slice(0, 3);

  return (
    <AppShell eyebrow="Profissional" title="Currículo">
      <div className="space-y-5">
        <ResumeSectionNav sections={sections} />

        <div className="space-y-5">
          {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{personalErrorMessages[params.error] ?? `Verifique os dados informados. Código: ${params.error}`}</p> : null}
          {params.message ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">Atualização salva.</p> : null}

          <section className="grid gap-4 border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="border border-blue-100 bg-blue-50 p-4">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-blue-700">
                <Target aria-hidden="true" size={15} />
                Qualidade do currículo
              </p>
              <div className="mt-3 flex items-end gap-2">
                <strong className="text-4xl leading-none text-slate-950">{resumeCompletion}%</strong>
                <span className="text-sm font-semibold text-slate-600">completo</span>
              </div>
              <div className="mt-4 h-2 bg-white">
                <span className="block h-full bg-blue-700" style={{ width: `${resumeCompletion}%` }} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">Quanto mais completo, melhor a leitura para triagem e compatibilidade.</p>
            </div>
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Revise os pontos principais</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Use os atalhos abaixo para deixar o perfil pronto para empresas e recrutadores internos.</p>
                </div>
                <ResumeDownloadCustomizer exportUrl="/professional/resume/export" hasDocument={Boolean(activeVersion && documentUrl?.signedUrl)} showSalaryExpectation={prefs.show_salary_expectation} />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {resumeChecklist.map((item) => (
                  <a key={item.label} href={item.href} className={`flex items-center gap-2 border px-3 py-2 text-sm font-semibold ${item.done ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                    <CheckCircle2 aria-hidden="true" size={16} />
                    {item.label}
                  </a>
                ))}
              </div>
              {nextResumeActions.length > 0 ? (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <strong className="block">Próximos ajustes recomendados</strong>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nextResumeActions.map((item) => (
                      <Link key={item.label} href={item.href} className="rounded-md bg-white px-3 py-1.5 font-semibold text-amber-900">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section id="dados-pessoais" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold uppercase">Dados pessoais</h2>
            <form action={updateResumePersonalAction} className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">Nome<input name="firstName" required defaultValue={nameParts.firstName} className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Sobrenome<input name="lastName" required defaultValue={nameParts.lastName} className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Nacionalidade<input name="nationality" required defaultValue={professional?.nationality ?? "Brasileira"} className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Email<input name="email" required type="email" defaultValue={professional?.email ?? userData.user?.email ?? ""} className="field-input mt-2" /></label>
              <PersonalDataFields
                identityRequired
                initial={{
                  cpf: professional?.cpf,
                  birthDate: professional?.birth_date,
                  phone: professional?.phone,
                  cep: professional?.cep,
                  street: professional?.street,
                  addressNumber: professional?.address_number,
                  neighborhood: professional?.neighborhood,
                  city: professional?.city,
                  state: professional?.state
                }}
              />
              <div className="md:col-span-2"><button className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Salvar dados pessoais</button></div>
            </form>
          </section>

          <section id="confidencialidade" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" size={18} className="text-blue-700" />
              <h2 className="text-lg font-semibold">Segurança e Confidencialidade</h2>
            </div>
            <form action={updateUserSettingsAction} className="mt-5 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="redirectTo" value="/professional/resume" />
              <label className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-3 text-sm font-medium"><input name="profileVisible" type="checkbox" defaultChecked={prefs.profile_visible} className="mt-1 size-4" /><span><strong className="block">Currículo visível</strong><span className="text-slate-600">Permitir que recrutadores internos vejam seu perfil.</span></span></label>
              <label className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-3 text-sm font-medium"><input name="allowRecruiterContact" type="checkbox" defaultChecked={prefs.allow_recruiter_contact} className="mt-1 size-4" /><span><strong className="block">Permitir contato</strong><span className="text-slate-600">Receber contato quando houver compatibilidade.</span></span></label>
              <label className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-3 text-sm font-medium"><input name="opportunityAlerts" type="checkbox" defaultChecked={prefs.opportunity_alerts} className="mt-1 size-4" /><span><strong className="block">Alertas de vagas</strong><span className="text-slate-600">Usar seu currículo para recomendar vagas.</span></span></label>
              <label className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-3 text-sm font-medium"><input name="emailNotifications" type="checkbox" defaultChecked={prefs.email_notifications} className="mt-1 size-4" /><span><strong className="block">Notificações por email</strong><span className="text-slate-600">Receber avisos importantes do processo.</span></span></label>
              <label className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-3 text-sm font-medium md:col-span-2"><input name="showSalaryExpectation" type="checkbox" defaultChecked={prefs.show_salary_expectation} className="mt-1 size-4" /><span><strong className="block">Exibir pretensão salarial</strong><span className="text-slate-600">Mostrar essa informação quando estiver cadastrada.</span></span></label>
              <div className="md:col-span-2"><button className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Salvar confidencialidade</button></div>
            </form>
          </section>

          <section id="objetivo" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden="true" size={18} className="text-blue-700" />
              <h2 className="text-lg font-semibold">Objetivo profissional</h2>
            </div>
            <form action={updateResumeProfileAction} className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">Cargo desejado<input name="desiredRole" required defaultValue={professional?.desired_role ?? ""} className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Grau de instrucao atual
                <select name="educationLevel" defaultValue={professional?.education_level ?? "medio"} className="field-input mt-2">
                  {educationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Disponibilidade em dias<input name="availableInDays" type="number" min="0" defaultValue={professional?.available_in_days ?? 0} className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Localização<input readOnly value={`${professional?.city ?? "Cidade"}/${professional?.state ?? "UF"}`} className="field-input mt-2 bg-slate-100" /></label>
              <label className="text-sm font-semibold md:col-span-2">Resumo do currículo<textarea name="summary" rows={5} defaultValue={professional?.summary ?? ""} className="field-input mt-2" /></label>
              <div className="md:col-span-2"><button className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white" type="submit">Salvar objetivo</button></div>
            </form>
          </section>

          <section id="formacao" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <GraduationCap aria-hidden="true" size={18} className="text-blue-700" />
              <h2 className="text-lg font-semibold">Histórico acadêmico</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Adicione instituições, cursos tecnicos, graduacoes e pos-graduacoes. O grau de instrucao atual fica separado no objetivo profissional.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {((educations ?? []) as EducationRow[]).map((education) => (
                <article key={education.id} className="border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">{education.course_name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{education.institution}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{education.level} · {education.completed_at ? new Date(education.completed_at).getFullYear() : "Em andamento"}</p>
                </article>
              ))}
              {(educations ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma formação adicionada.</p> : null}
            </div>
            <form action={addProfessionalEducationAction} className="mt-6 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
              <label className="text-sm font-semibold">Tipo de formação<select name="level" className="field-input mt-2">{educationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <InstitutionAutocomplete required />
              <label className="text-sm font-semibold">Nome do curso ou área<input name="courseName" required className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Conclusão<DateTextInput name="completedAt" className="field-input mt-2" /></label>
              <div className="md:col-span-2"><button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit"><Plus aria-hidden="true" size={16} />Adicionar histórico academico</button></div>
            </form>
          </section>

          <section id="experiencias" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness aria-hidden="true" size={18} className="text-blue-700" />
              <h2 className="text-lg font-semibold">Experiência profissional</h2>
            </div>
            <div className="mt-5 space-y-3">
              {((experiences ?? []) as ExperienceRow[]).map((experience) => (
                <article key={experience.id} className="border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">{experience.role_title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{experience.company_name} · {dateLabel(experience.started_at)} até {experience.is_current ? "Atual" : dateLabel(experience.ended_at)}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{experience.description}</p>
                </article>
              ))}
              {(experiences ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma experiência adicionada.</p> : null}
            </div>
            <form action={addProfessionalExperienceAction} className="mt-6 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
              <label className="text-sm font-semibold">Empresa<input name="companyName" required className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Cargo<input name="roleTitle" required className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Inicio<DateTextInput name="startedAt" required className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Fim<DateTextInput name="endedAt" className="field-input mt-2" /></label>
              <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2"><input name="isCurrent" type="checkbox" /> Trabalho atualmente aqui</label>
              <label className="text-sm font-semibold md:col-span-2">Atividades e resultados<textarea name="description" required rows={4} className="field-input mt-2" /></label>
              <div className="md:col-span-2"><button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit"><Plus aria-hidden="true" size={16} />Adicionar experiência</button></div>
            </form>
          </section>

          <section id="cursos" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Cursos e qualificações</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {((courses ?? []) as CourseRow[]).map((course) => (
                <article key={course.id} className="border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">{course.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{course.institution ?? "Instituição não informada"}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{course.workload_hours ? `${course.workload_hours}h` : "Carga não informada"} · {course.completed_at ? new Date(course.completed_at).getFullYear() : "Em andamento"}</p>
                </article>
              ))}
              {(courses ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhum curso adicionado.</p> : null}
            </div>
            <form action={addProfessionalCourseAction} className="mt-6 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
              <label className="text-sm font-semibold">Curso<input name="name" required className="field-input mt-2" /></label>
              <InstitutionAutocomplete required={false} />
              <label className="text-sm font-semibold">Carga horária<input name="workloadHours" type="number" min="0" className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Conclusão<DateTextInput name="completedAt" className="field-input mt-2" /></label>
              <div className="md:col-span-2"><button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit"><Plus aria-hidden="true" size={16} />Adicionar curso</button></div>
            </form>
          </section>

          <section id="idiomas" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Languages aria-hidden="true" size={18} className="text-blue-700" />
              <h2 className="text-lg font-semibold">Idiomas</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {((languages ?? []) as LanguageRow[]).map((language) => (
                <article key={language.id} className="border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">{language.language_name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{language.proficiency}</p>
                </article>
              ))}
              {(languages ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhum idioma adicionado.</p> : null}
            </div>
            <form action={addProfessionalLanguageAction} className="mt-6 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
              <label className="text-sm font-semibold">Idioma<input name="languageName" required className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Nível<select name="proficiency" className="field-input mt-2"><option>Básico</option><option>Intermediário</option><option>Avancado</option><option>Fluente</option></select></label>
              <div className="md:col-span-2"><button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit"><Plus aria-hidden="true" size={16} />Adicionar idioma</button></div>
            </form>
          </section>

          <section id="habilidades" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Habilidades e competências</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {((skills ?? []) as SkillRow[]).map((skill) => (
                <span key={skill.id} className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold">{skill.name} · {skill.skill_type} · {skill.proficiency ?? 1}/5</span>
              ))}
              {(skills ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhuma habilidade adicionada.</p> : null}
            </div>
            <form action={addProfessionalSkillAction} className="mt-6 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-3">
              <label className="text-sm font-semibold">Habilidade<input name="name" required className="field-input mt-2" /></label>
              <label className="text-sm font-semibold">Tipo<select name="skillType" className="field-input mt-2"><option value="technical">Técnica</option><option value="behavioral">Comportamental</option></select></label>
              <label className="text-sm font-semibold">Nível<select name="proficiency" className="field-input mt-2"><option value="1">1 - iniciante</option><option value="2">2</option><option value="3">3 - bom</option><option value="4">4</option><option value="5">5 - excelente</option></select></label>
              <div className="md:col-span-3"><button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit"><Plus aria-hidden="true" size={16} />Adicionar habilidade</button></div>
            </form>
          </section>

          <section id="documento" className="scroll-mt-72 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <FileText aria-hidden="true" size={18} />
                <h2 className="font-semibold text-slate-950">Documento anexado</h2>
              </div>
              <ResumeDownloadCustomizer exportUrl="/professional/resume/export" hasDocument={Boolean(activeVersion && documentUrl?.signedUrl)} showSalaryExpectation={prefs.show_salary_expectation} />
            </div>
            {activeVersion ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="rounded bg-slate-50 p-3">Versão {activeVersion.version} · {new Date(activeVersion.generated_at).toLocaleDateString("pt-BR")}</p>
                {documentUrl?.signedUrl ? <a href={documentUrl.signedUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-md bg-slate-950 px-4 py-2.5 font-semibold text-white">Visualizar documento</a> : null}
              </div>
            ) : <p className="mt-4 text-sm leading-6 text-slate-600">Nenhum documento enviado ainda.</p>}
            <form action={uploadProfessionalResumeAction} className="mt-5 border-t border-slate-200 pt-5">
              <label className="text-sm font-semibold">Substituir arquivo<input name="resume" type="file" required accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="mt-2 w-full border border-dashed border-slate-300 bg-slate-50 p-3 text-sm" /></label>
              <button className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white" type="submit"><Upload aria-hidden="true" size={16} />Enviar novo currículo</button>
            </form>
            {isPdf && documentUrl?.signedUrl ? <iframe title="Previa do currículo" src={documentUrl.signedUrl} className="mt-5 h-[520px] w-full border border-slate-200" /> : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
