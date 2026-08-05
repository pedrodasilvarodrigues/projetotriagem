import Link from "next/link";
import { ArrowLeft, Award, BookOpen, BriefcaseBusiness, GraduationCap, Languages, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { createServerClient } from "@/lib/supabase/server";

type ResumeData = {
  process_id: string;
  process_status: string;
  demand: { title: string; name: string | null };
  professional: {
    full_name: string;
    desired_role: string | null;
    summary: string | null;
    education_level: string | null;
    city: string | null;
    state: string | null;
    available_in_days: number | null;
  };
  experiences: Array<{ id: string; company_name: string; role_title: string; description: string; started_at: string; ended_at: string | null; is_current: boolean }>;
  educations: Array<{ id: string; level: string; institution: string; course_name: string; completed_at: string | null }>;
  courses: Array<{ id: string; name: string; institution: string | null; workload_hours: number | null; completed_at: string | null }>;
  certificates: Array<{ id: string; name: string; issuer: string | null; issued_at: string | null; expires_at: string | null }>;
  skills: Array<{ id: string; name: string; skill_type: string; proficiency: number | null }>;
  languages: Array<{ id: string; language_name: string; proficiency: string }>;
};

function dateLabel(value?: string | null) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "Atual";
}

export default async function CompanyCandidateResumePage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(processId)) notFound();

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("get_company_candidate_resume", { target_process_id: processId });
  if (error || !data) redirect("/company/candidates?error=curriculo-indisponivel");
  const resume = data as unknown as ResumeData;
  const { data: candidateAvatars } = await supabase.rpc("list_company_candidate_avatars");
  const avatarPath = ((candidateAvatars ?? []) as Array<{ process_id: string; avatar_path: string }>).find((item) => item.process_id === processId)?.avatar_path;
  const { data: avatarData } = avatarPath ? await supabase.storage.from("avatars").createSignedUrl(avatarPath, 60 * 60) : { data: null };
  const technicalSkills = resume.skills.filter((skill) => skill.skill_type === "technical");
  const behavioralSkills = resume.skills.filter((skill) => skill.skill_type !== "technical");

  return (
    <AppShell eyebrow="Empresa" title="Currículo do candidato">
      <div className="space-y-5 pb-8">
        <Link href="/company/candidates" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-[#0F2D4E] transition hover:border-[#F2811D] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2811D] focus-visible:ring-offset-2">
          <ArrowLeft aria-hidden="true" size={17} /> Voltar aos candidatos
        </Link>

        <section className="relative overflow-hidden rounded-2xl bg-[#0F2D4E] p-6 text-white shadow-[0_18px_46px_rgba(15,45,78,.2)] sm:p-8">
          <div className="absolute inset-y-0 right-0 w-2 bg-[#F2811D]" />
          <div className="relative flex max-w-4xl flex-col gap-5 sm:flex-row sm:items-start">
            <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white/90 bg-[#DDE7F0] text-3xl font-bold text-[#0F2D4E] shadow-[0_0_0_2px_rgba(242,129,29,.75),0_18px_36px_rgba(0,0,0,.22)]">
              {avatarData?.signedUrl ? <img src={avatarData.signedUrl} alt={`Foto de ${resume.professional.full_name}`} className="size-full object-cover" /> : resume.professional.full_name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-[#FFB36D]"><ShieldCheck aria-hidden="true" size={15} /> Currículo protegido</p>
              <h2 className="mt-3 font-display text-3xl font-bold">{resume.professional.full_name}</h2>
              <p className="mt-2 text-base font-semibold text-slate-100">{resume.professional.desired_role ?? "Objetivo profissional não informado"}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">{resume.professional.summary ?? "O profissional ainda não adicionou um resumo ao currículo."}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-100">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5"><MapPin size={14} /> {resume.professional.city ?? "Cidade não informada"}/{resume.professional.state ?? "--"}</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">Candidatura para: {resume.demand.name ?? resume.demand.title}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,45,78,.06)] sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-[#0F2D4E]"><BriefcaseBusiness className="text-[#F2811D]" size={20} /> Experiência</h2>
              <div className="mt-5 space-y-5">
                {resume.experiences.map((item) => (
                  <article key={item.id} className="border-l-2 border-[#F2811D] pl-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-[#0F2D4E]">{item.role_title}</h3><p className="text-sm font-semibold text-slate-600">{item.company_name}</p></div><span className="text-xs font-semibold text-slate-500">{dateLabel(item.started_at)} – {item.is_current ? "Atual" : dateLabel(item.ended_at)}</span></div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </article>
                ))}
                {resume.experiences.length === 0 ? <p className="text-sm text-slate-500">Nenhuma experiência cadastrada.</p> : null}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,45,78,.06)] sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-[#0F2D4E]"><GraduationCap className="text-[#F2811D]" size={20} /> Formação</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {resume.educations.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-bold text-[#0F2D4E]">{item.course_name}</h3><p className="mt-1 text-sm text-slate-600">{item.institution}</p><p className="mt-2 text-xs font-semibold text-slate-500">{item.level} · {item.completed_at ? dateLabel(item.completed_at) : "Em andamento"}</p></article>)}
                {resume.educations.length === 0 ? <p className="text-sm text-slate-500">Nenhuma formação cadastrada.</p> : null}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,45,78,.06)]">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#0F2D4E]"><Sparkles className="text-[#F2811D]" size={19} /> Competências</h2>
              <div className="mt-4"><p className="text-xs font-bold uppercase text-slate-500">Técnicas</p><div className="mt-2 flex flex-wrap gap-2">{technicalSkills.map((item) => <span key={item.id} className="rounded-full bg-[#0F2D4E] px-3 py-1.5 text-xs font-semibold text-white">{item.name}</span>)}{technicalSkills.length === 0 ? <span className="text-sm text-slate-500">Não informadas.</span> : null}</div></div>
              <div className="mt-5"><p className="text-xs font-bold uppercase text-slate-500">Comportamentais</p><div className="mt-2 flex flex-wrap gap-2">{behavioralSkills.map((item) => <span key={item.id} className="rounded-full border border-[#F2811D]/35 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#8F3E09]">{item.name}</span>)}{behavioralSkills.length === 0 ? <span className="text-sm text-slate-500">Não informadas.</span> : null}</div></div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,45,78,.06)]">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#0F2D4E]"><Languages className="text-[#F2811D]" size={19} /> Idiomas</h2>
              <div className="mt-4 space-y-2">{resume.languages.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><strong className="text-[#0F2D4E]">{item.language_name}</strong><span className="text-slate-600">{item.proficiency}</span></div>)}{resume.languages.length === 0 ? <p className="text-sm text-slate-500">Nenhum idioma cadastrado.</p> : null}</div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,45,78,.06)]">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#0F2D4E]"><BookOpen className="text-[#F2811D]" size={19} /> Cursos</h2>
              <div className="mt-4 space-y-3">{resume.courses.map((item) => <article key={item.id}><h3 className="text-sm font-bold text-[#0F2D4E]">{item.name}</h3><p className="text-xs leading-5 text-slate-600">{item.institution ?? "Instituição não informada"}{item.workload_hours ? ` · ${item.workload_hours}h` : ""}</p></article>)}{resume.courses.length === 0 ? <p className="text-sm text-slate-500">Nenhum curso cadastrado.</p> : null}</div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,45,78,.06)]">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#0F2D4E]"><Award className="text-[#F2811D]" size={19} /> Certificados</h2>
              <div className="mt-4 space-y-3">{resume.certificates.map((item) => <article key={item.id}><h3 className="text-sm font-bold text-[#0F2D4E]">{item.name}</h3><p className="text-xs leading-5 text-slate-600">{item.issuer ?? "Emissor não informado"}{item.issued_at ? ` · ${dateLabel(item.issued_at)}` : ""}</p></article>)}{resume.certificates.length === 0 ? <p className="text-sm text-slate-500">Nenhum certificado cadastrado.</p> : null}</div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
