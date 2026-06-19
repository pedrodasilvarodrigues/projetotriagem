import { NextRequest } from "next/server";
import { generateProfessionalResumePdf, type ResumeTemplateId } from "@/lib/pdf/resume";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type EducationRow = { level: string; institution: string; course_name: string; completed_at: string | null };
type ExperienceRow = { company_name: string; role_title: string; description: string; started_at: string; ended_at: string | null; is_current: boolean };
type CourseRow = { name: string; institution: string | null; workload_hours: number | null; completed_at: string | null };
type LanguageRow = { language_name: string; proficiency: string };
type SkillRow = { name: string; skill_type: string; proficiency: number | null };

const templateIds = ["classico", "editorial", "linha"] as const;
const colorMap = {
  cinza: "#d8d9d0",
  azul: "#9fc9f0",
  verde: "#afd984",
  coral: "#f28486",
  laranja: "#ffa255",
  amarelo: "#ffe68a",
  roxo: "#b69ded"
} satisfies Record<string, string>;

const educationLabels: Record<string, string> = {
  fundamental: "Fundamental",
  medio: "Medio",
  tecnico: "Técnico",
  superior: "Superior",
  pos: "Pos-graduacao",
  mba: "MBA",
  mestrado: "Mestrado",
  doutorado: "Doutorado"
};

function cleanFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "curriculo";
}

function yearLabel(value?: string | null) {
  if (!value) return "";
  return new Date(value).getFullYear().toString();
}

function dateLabel(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return new Response("Não autenticado", { status: 401 });

  const selectedTemplate = request.nextUrl.searchParams.get("template");
  const template: ResumeTemplateId = templateIds.includes(selectedTemplate as ResumeTemplateId) ? selectedTemplate as ResumeTemplateId : "classico";
  const colorKey = request.nextUrl.searchParams.get("color") ?? "cinza";
  const accentColor = colorKey in colorMap ? colorMap[colorKey as keyof typeof colorMap] : colorMap.cinza;
  const showSalaryExpectation = request.nextUrl.searchParams.get("salary") === "1";

  const { data: professional } = await supabase
    .from("professionals")
    .select("id,full_name,desired_role,summary,education_level,city,state,available_in_days,email,phone")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!professional?.id) return new Response("Perfil profissional não encontrado", { status: 404 });

  const [{ data: educations }, { data: experiences }, { data: courses }, { data: languages }, { data: skills }] = await Promise.all([
    supabase.from("professional_educations").select("level,institution,course_name,completed_at").eq("professional_id", professional.id).order("created_at", { ascending: false }),
    supabase.from("professional_experiences").select("company_name,role_title,description,started_at,ended_at,is_current").eq("professional_id", professional.id).order("started_at", { ascending: false }),
    supabase.from("professional_courses").select("name,institution,workload_hours,completed_at").eq("professional_id", professional.id).order("created_at", { ascending: false }),
    supabase.from("professional_languages").select("language_name,proficiency").eq("professional_id", professional.id).order("created_at", { ascending: false }),
    supabase.from("professional_skills").select("name,skill_type,proficiency").eq("professional_id", professional.id).order("created_at", { ascending: false })
  ]);

  const pdfBuffer = await generateProfessionalResumePdf({
    template,
    accentColor,
    showSalaryExpectation,
    fullName: professional.full_name ?? "Profissional",
    email: professional.email ?? userData.user.email ?? "Email não informado",
    phone: professional.phone ?? "",
    city: professional.city ?? "Cidade",
    state: professional.state ?? "UF",
    desiredRole: professional.desired_role ?? "",
    summary: professional.summary ?? "",
    educationLevel: educationLabels[professional.education_level ?? ""] ?? professional.education_level ?? "Não informado",
    availableInDays: professional.available_in_days ?? 0,
    educations: ((educations ?? []) as EducationRow[]).map((education) => ({
      level: educationLabels[education.level] ?? education.level,
      institution: education.institution,
      courseName: education.course_name,
      completedAt: yearLabel(education.completed_at)
    })),
    experiences: ((experiences ?? []) as ExperienceRow[]).map((experience) => ({
      companyName: experience.company_name,
      roleTitle: experience.role_title,
      period: `${dateLabel(experience.started_at)} até ${experience.is_current ? "Atual" : dateLabel(experience.ended_at)}`.trim(),
      description: experience.description
    })),
    courses: ((courses ?? []) as CourseRow[]).map((course) => ({
      name: course.name,
      institution: course.institution ?? "Instituição não informada",
      details: [course.workload_hours ? `${course.workload_hours}h` : "", yearLabel(course.completed_at)].filter(Boolean).join(" | ")
    })),
    languages: ((languages ?? []) as LanguageRow[]).map((language) => ({
      language: language.language_name,
      proficiency: language.proficiency
    })),
    skills: ((skills ?? []) as SkillRow[]).map((skill) => ({
      name: skill.name,
      type: skill.skill_type === "behavioral" ? "Comportamental" : "Técnica",
      proficiency: `${skill.proficiency ?? 1}/5`
    }))
  });

  const fileName = `${cleanFileName(professional.full_name ?? "curriculo")}-${template}.pdf`;
  const body = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
