import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { extractResumeFromPdf, type ImportedResume } from "@/lib/resume/pdf-import";

export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024;

export function validateResumePdf(file: unknown) {
  if (!(file instanceof File) || file.size === 0) return "arquivo-obrigatorio";
  if (file.size > MAX_RESUME_FILE_SIZE) return "arquivo-maior-que-5mb";
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return "formato-invalido";
  return null;
}

function importSummary(parsed: ImportedResume) {
  return {
    extracted_characters: parsed.extractedCharacters,
    desired_role: Boolean(parsed.desiredRole),
    summary: Boolean(parsed.summary),
    educations: parsed.educations.length,
    experiences: parsed.experiences.length,
    courses: parsed.courses.length,
    skills: parsed.skills.length,
    languages: parsed.languages.length
  };
}

async function mergeStructuredResume(client: SupabaseClient, professionalId: string, parsed: ImportedResume) {
  const updates: Record<string, string> = {};
  if (parsed.desiredRole) updates.desired_role = parsed.desiredRole;
  if (parsed.summary) updates.summary = parsed.summary;
  if (Object.keys(updates).length) await client.from("professionals").update(updates).eq("id", professionalId);

  const [existingEducations, existingExperiences, existingCourses, existingSkills, existingLanguages] = await Promise.all([
    client.from("professional_educations").select("institution,course_name").eq("professional_id", professionalId),
    client.from("professional_experiences").select("company_name,role_title,started_at").eq("professional_id", professionalId),
    client.from("professional_courses").select("name,institution").eq("professional_id", professionalId),
    client.from("professional_skills").select("name").eq("professional_id", professionalId),
    client.from("professional_languages").select("language_name").eq("professional_id", professionalId)
  ]);
  const key = (...values: Array<string | null | undefined>) => values.map((value) => value?.trim().toLocaleLowerCase("pt-BR") ?? "").join("|");

  const educationKeys = new Set((existingEducations.data ?? []).map((item) => key(item.institution, item.course_name)));
  const experienceKeys = new Set((existingExperiences.data ?? []).map((item) => key(item.company_name, item.role_title, item.started_at)));
  const courseKeys = new Set((existingCourses.data ?? []).map((item) => key(item.name, item.institution)));
  const skillKeys = new Set((existingSkills.data ?? []).map((item) => key(item.name)));
  const languageKeys = new Set((existingLanguages.data ?? []).map((item) => key(item.language_name)));

  const educations = parsed.educations.filter((item) => !educationKeys.has(key(item.institution, item.courseName))).map((item) => ({ professional_id: professionalId, level: item.level, institution: item.institution, course_name: item.courseName, completed_at: item.completedAt }));
  const experiences = parsed.experiences.filter((item) => !experienceKeys.has(key(item.companyName, item.roleTitle, item.startedAt))).map((item) => ({ professional_id: professionalId, company_name: item.companyName, role_title: item.roleTitle, description: item.description, started_at: item.startedAt, ended_at: item.endedAt, is_current: item.isCurrent }));
  const courses = parsed.courses.filter((item) => !courseKeys.has(key(item.name, item.institution))).map((item) => ({ professional_id: professionalId, name: item.name, institution: item.institution, workload_hours: item.workloadHours, completed_at: item.completedAt }));
  const skills = parsed.skills.filter((name) => !skillKeys.has(key(name))).map((name) => ({ professional_id: professionalId, name, skill_type: "technical", proficiency: 3 }));
  const languages = parsed.languages.filter((item) => !languageKeys.has(key(item.name))).map((item) => ({ professional_id: professionalId, language_name: item.name, proficiency: item.proficiency }));

  const results = await Promise.all([
    educations.length ? client.from("professional_educations").insert(educations) : Promise.resolve({ error: null }),
    experiences.length ? client.from("professional_experiences").insert(experiences) : Promise.resolve({ error: null }),
    courses.length ? client.from("professional_courses").insert(courses) : Promise.resolve({ error: null }),
    skills.length ? client.from("professional_skills").insert(skills) : Promise.resolve({ error: null }),
    languages.length ? client.from("professional_languages").insert(languages) : Promise.resolve({ error: null })
  ]);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function saveUploadedResume(input: {
  client: SupabaseClient;
  userId: string;
  professionalId: string;
  file: File;
  source?: "registration" | "onboarding" | "workspace";
}) {
  const validationError = validateResumePdf(input.file);
  if (validationError) throw new Error(validationError);

  const fileBuffer = await input.file.arrayBuffer();
  const path = `${input.userId}/uploaded/curriculo-${input.source ?? "workspace"}-${Date.now()}.pdf`;
  const upload = await input.client.storage.from("curriculums").upload(path, fileBuffer, { contentType: "application/pdf", upsert: false });
  if (upload.error) throw new Error(upload.error.message);

  try {
    const { data: resume, error: resumeError } = await input.client.from("resumes").upsert({ professional_id: input.professionalId }, { onConflict: "professional_id" }).select("id").single();
    if (resumeError || !resume?.id) throw new Error(resumeError?.message ?? "curriculo-nao-criado");
    const { data: latestVersion } = await input.client.from("resume_versions").select("version").eq("resume_id", resume.id).order("version", { ascending: false }).limit(1).maybeSingle();
    const { data: version, error: versionError } = await input.client.from("resume_versions").insert({ resume_id: resume.id, version: Number(latestVersion?.version ?? 0) + 1, storage_path: path }).select("id").single();
    if (versionError || !version?.id) throw new Error(versionError?.message ?? "versao-nao-criada");
    const activeError = await input.client.from("resumes").update({ active_version_id: version.id }).eq("id", resume.id);
    if (activeError.error) throw new Error(activeError.error.message);

    try {
      const parsed = await extractResumeFromPdf(fileBuffer);
      await mergeStructuredResume(input.client, input.professionalId, parsed);
      return { path, importStatus: "completed" as const, importSummary: importSummary(parsed), importError: null };
    } catch (error) {
      return {
        path,
        importStatus: "partial" as const,
        importSummary: {},
        importError: error instanceof Error ? error.message.slice(0, 500) : "Não foi possível preencher os campos automaticamente."
      };
    }
  } catch (error) {
    await input.client.storage.from("curriculums").remove([path]);
    throw error;
  }
}

export async function saveResumeOnboardingChoice(input: {
  client: SupabaseClient;
  professionalId: string;
  choice: "uploaded" | "none";
  importStatus?: "not_requested" | "pending" | "completed" | "partial" | "failed";
  importSummary?: Record<string, unknown>;
  importError?: string | null;
}) {
  const { error } = await input.client.from("professional_resume_onboarding").upsert({
    professional_id: input.professionalId,
    choice: input.choice,
    prompt_status: input.choice === "none" ? "pending" : "not_applicable",
    import_status: input.importStatus ?? (input.choice === "uploaded" ? "pending" : "not_requested"),
    import_summary: input.importSummary ?? {},
    import_error: input.importError ?? null,
    imported_at: input.choice === "uploaded" && input.importStatus !== "pending" ? new Date().toISOString() : null,
    decided_at: new Date().toISOString()
  }, { onConflict: "professional_id" });
  if (error) throw new Error(error.message);
}
