"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureInstitutionName } from "@/lib/institutions-server";
import { generateResumePdf } from "@/lib/pdf/resume";
import { createServerClient } from "@/lib/supabase/server";
import { ageFromBirthDate, isValidBrazilianPhone, isValidCnpj, isValidCpf, onlyDigits } from "@/lib/validations/br";

const minimumAge = Number(process.env.MINIMUM_PROFESSIONAL_AGE ?? 14);

const optionalEmailSchema = z.preprocess((value) => {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  return text.length > 0 ? text : undefined;
}, z.string().email().optional());

const professionalSchema = z.object({
  fullName: z.string().min(3).regex(/^[\p{L}\s]+$/u),
  cpf: z.string().refine(isValidCpf, "cpf-invalido"),
  phone: z.string().refine(isValidBrazilianPhone, "telefone-invalido"),
  email: z.string().trim().toLowerCase().email(),
  birthDate: z.string().refine((value) => ageFromBirthDate(value) >= minimumAge, "idade-minima"),
  cep: z.string().refine((value) => onlyDigits(value).length === 8, "cep-invalido"),
  street: z.string().min(2),
  addressNumber: z.string().min(1),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2).max(2),
  terms: z.literal("on"),
  privacy: z.literal("on")
});

const companySchema = z.object({
  legalName: z.string().min(3),
  tradeName: z.string().min(2),
  cnpj: z.string().refine(isValidCnpj, "cnpj-invalido"),
  phone: z.string().refine(isValidBrazilianPhone, "telefone-invalido"),
  corporateEmail: optionalEmailSchema,
  cep: z.string().refine((value) => onlyDigits(value).length === 8, "cep-invalido"),
  street: z.string().min(2),
  addressNumber: z.string().min(1),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2).max(2),
  contactName: z.string().min(3).regex(/^[\p{L}\s]+$/u),
  contactRole: z.string().min(2),
  contactPhone: z.string().refine(isValidBrazilianPhone, "telefone-responsavel-invalido"),
  terms: z.literal("on"),
  privacy: z.literal("on")
});

async function requireUser() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?error=sessao-expirada");
  return { supabase, user: data.user };
}

async function recordConsent(userId: string) {
  const supabase = await createServerClient();
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0] ?? null;
  const userAgent = headerStore.get("user-agent");

  await supabase.from("consent_records").insert({
    user_id: userId,
    terms_version: "2026-06-03",
    privacy_version: "2026-06-03",
    ip_address: ip,
    user_agent: userAgent
  });
}

export async function chooseProfessionalAction() {
  const { supabase, user } = await requireUser();
  await supabase.from("user_roles").upsert({ user_id: user.id, role: "professional" });
  redirect("/onboarding/professional");
}

export async function chooseCompanyAction() {
  const { supabase, user } = await requireUser();
  await supabase.from("user_roles").upsert({ user_id: user.id, role: "company" });
  redirect("/onboarding/company");
}

export async function saveProfessionalBasicsAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = professionalSchema.safeParse({
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    birthDate: formData.get("birthDate"),
    cep: formData.get("cep"),
    street: formData.get("street"),
    addressNumber: formData.get("addressNumber"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),
    terms: formData.get("terms"),
    privacy: formData.get("privacy")
  });

  if (!parsed.success) redirect("/onboarding/professional?error=dados-invalidos");

  const data = parsed.data;
  const normalizedCpf = onlyDigits(data.cpf);
  const { data: duplicatedCpf } = await supabase.from("professionals").select("id,user_id").eq("cpf", normalizedCpf).neq("user_id", user.id).maybeSingle();
  if (duplicatedCpf) redirect("/onboarding/professional?error=cpf-ja-cadastrado");

  await supabase.from("profiles").update({ full_name: data.fullName, email: data.email, phone: onlyDigits(data.phone), status: "pending" }).eq("id", user.id);
  await supabase.from("user_roles").upsert({ user_id: user.id, role: "professional" });
  const { error } = await supabase.from("professionals").upsert({
    user_id: user.id,
    full_name: data.fullName,
    email: data.email,
    cpf: normalizedCpf,
    phone: onlyDigits(data.phone),
    birth_date: data.birthDate,
    desired_role: "A definir",
    education_level: "medio",
    cep: onlyDigits(data.cep),
    street: data.street,
    address_number: data.addressNumber,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state.toUpperCase(),
    status: "pending"
  }, { onConflict: "user_id" });
  if (error) redirect(`/onboarding/professional?error=${encodeURIComponent(error.message)}`);
  await recordConsent(user.id);
  redirect("/professional");
}

export async function uploadResumeAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const file = formData.get("resume");

  if (!(file instanceof File) || file.size === 0) redirect("/onboarding/professional/resume?error=arquivo-obrigatorio");
  if (file.size > 5 * 1024 * 1024) redirect("/onboarding/professional/resume?error=arquivo-maior-que-5mb");

  const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowedTypes.includes(file.type)) redirect("/onboarding/professional/resume?error=formato-invalido");

  const extension = file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
  const path = `${user.id}/uploaded/curriculo-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("curriculums").upload(path, file, { upsert: true });
  if (error) redirect(`/onboarding/professional/resume?error=${encodeURIComponent(error.message)}`);

  const { data: professional } = await supabase.from("professionals").select("id").eq("user_id", user.id).single();
  if (professional?.id) {
    const { data: resume } = await supabase.from("resumes").upsert({ professional_id: professional.id }, { onConflict: "professional_id" }).select("id").single();
    if (resume?.id) {
      const { data: latestVersion } = await supabase.from("resume_versions").select("version").eq("resume_id", resume.id).order("version", { ascending: false }).limit(1).maybeSingle();
      const nextVersion = Number(latestVersion?.version ?? 0) + 1;
      const { data: version } = await supabase.from("resume_versions").insert({ resume_id: resume.id, version: nextVersion, storage_path: path }).select("id").single();
      if (version?.id) {
        await supabase.from("resumes").update({ active_version_id: version.id }).eq("id", resume.id);
      }
    }
  }

  redirect("/professional");
}

export async function generateResumeAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data: professional } = await supabase.from("professionals").select("id,full_name,email,phone,city,state").eq("user_id", user.id).single();
  if (!professional?.id) redirect("/onboarding/professional?error=complete-dados-pessoais");

  const education = String(formData.get("education") ?? "");
  const institution = String(formData.get("institution") ?? "");
  const courseName = String(formData.get("courseName") ?? "");
  const completionYear = String(formData.get("completionYear") ?? "");
  const experienceCompany = String(formData.get("experienceCompany") ?? "");
  const experienceRole = String(formData.get("experienceRole") ?? "");
  const experienceStart = String(formData.get("experienceStart") ?? "");
  const experienceEnd = String(formData.get("experienceEnd") ?? "");
  const experienceDescription = String(formData.get("experienceDescription") ?? "");
  const freeCourseName = String(formData.get("freeCourseName") ?? "");
  const freeCourseInstitution = String(formData.get("freeCourseInstitution") ?? "");
  const workload = String(formData.get("workload") ?? "");
  const skillValues = formData.getAll("skills").map(String);

  if (!education || !institution || !courseName || skillValues.length === 0) {
    redirect("/onboarding/professional/resume?error=dados-do-curriculo-obrigatorios");
  }

  const institutionName = await ensureInstitutionName(supabase, user.id, institution);
  const freeCourseInstitutionName = await ensureInstitutionName(supabase, user.id, freeCourseInstitution);

  if (education && institutionName && courseName) {
    await supabase.from("professional_educations").insert({ professional_id: professional.id, level: "medio", institution: institutionName, course_name: courseName });
  }

  if (experienceCompany && experienceRole && experienceStart) {
    await supabase.from("professional_experiences").insert({
      professional_id: professional.id,
      company_name: experienceCompany,
      role_title: experienceRole,
      description: experienceDescription || "Experiência informada no primeiro acesso.",
      started_at: experienceStart,
      ended_at: experienceEnd || null
    });
  }

  if (freeCourseName) {
    await supabase.from("professional_courses").insert({
      professional_id: professional.id,
      name: freeCourseName,
      institution: freeCourseInstitutionName || null,
      workload_hours: workload ? Number(workload) : null
    });
  }

  await Promise.all(skillValues.map((skill) => supabase.from("professional_skills").insert({ professional_id: professional.id, name: skill, skill_type: "technical", proficiency: 3 })));

  const path = `${user.id}/generated/curriculo-gerado-${Date.now()}.pdf`;
  const pdfBuffer = await generateResumePdf({
    fullName: professional.full_name,
    email: professional.email,
    phone: professional.phone,
    city: professional.city,
    state: professional.state,
    education,
    courseName,
    institution: institutionName ?? institution,
    completionYear,
    experienceCompany,
    experienceRole,
    experiencePeriod: [experienceStart, experienceEnd].filter(Boolean).join(" - "),
    experienceDescription,
    freeCourseName,
    freeCourseInstitution: freeCourseInstitutionName ?? freeCourseInstitution,
    workload,
    skills: skillValues
  });
  const { error: uploadError } = await supabase.storage.from("curriculums").upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) redirect(`/onboarding/professional/resume?error=${encodeURIComponent(uploadError.message)}`);

  const { data: resume } = await supabase.from("resumes").upsert({ professional_id: professional.id }, { onConflict: "professional_id" }).select("id").single();
  if (resume?.id) {
    const { data: latestVersion } = await supabase.from("resume_versions").select("version").eq("resume_id", resume.id).order("version", { ascending: false }).limit(1).maybeSingle();
    const nextVersion = Number(latestVersion?.version ?? 0) + 1;
    const { data: version } = await supabase.from("resume_versions").insert({ resume_id: resume.id, version: nextVersion, storage_path: path }).select("id").single();
    if (version?.id) {
      await supabase.from("resumes").update({ active_version_id: version.id }).eq("id", resume.id);
    }
  }

  redirect("/professional");
}

export async function saveCompanyAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = companySchema.safeParse({
    legalName: formData.get("legalName"),
    tradeName: formData.get("tradeName"),
    cnpj: formData.get("cnpj"),
    phone: formData.get("phone"),
    corporateEmail: formData.get("corporateEmail"),
    cep: formData.get("cep"),
    street: formData.get("street"),
    addressNumber: formData.get("addressNumber"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),
    contactName: formData.get("contactName"),
    contactRole: formData.get("contactRole"),
    contactPhone: formData.get("contactPhone"),
    terms: formData.get("terms"),
    privacy: formData.get("privacy")
  });

  if (!parsed.success) redirect("/onboarding/company?error=dados-invalidos");

  const data = parsed.data;
  const normalizedCnpj = onlyDigits(data.cnpj);
  const corporateEmail = data.corporateEmail ?? user.email;
  if (!corporateEmail) redirect("/onboarding/company?error=email-invalido");

  const { data: duplicatedCnpj } = await supabase.from("companies").select("id,owner_id").eq("cnpj", normalizedCnpj).neq("owner_id", user.id).maybeSingle();
  if (duplicatedCnpj) redirect("/onboarding/company?error=cnpj-ja-cadastrado");

  await supabase.from("user_roles").upsert({ user_id: user.id, role: "company" });
  const { data: company, error } = await supabase.from("companies").upsert({
    owner_id: user.id,
    legal_name: data.legalName,
    trade_name: data.tradeName,
    cnpj: normalizedCnpj,
    phone: onlyDigits(data.phone),
    corporate_email: corporateEmail,
    cep: onlyDigits(data.cep),
    street: data.street,
    address_number: data.addressNumber,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state.toUpperCase(),
    status: "pending"
  }, { onConflict: "cnpj" }).select("id").single();

  if (error || !company?.id) redirect(`/onboarding/company?error=${encodeURIComponent(error?.message ?? "empresa-nao-criada")}`);

  await supabase.from("company_contacts").insert({
    company_id: company.id,
    name: data.contactName,
    email: corporateEmail,
    phone: onlyDigits(data.contactPhone),
    role_title: data.contactRole
  });
  await recordConsent(user.id);
  redirect("/company");
}
