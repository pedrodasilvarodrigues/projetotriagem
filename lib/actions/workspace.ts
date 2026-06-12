"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/access";
import { createServerClient } from "@/lib/supabase/server";
import { ageFromBirthDate, isValidBrazilianPhone, isValidCnpj, isValidCpf, onlyDigits } from "@/lib/validations/br";

const demandSchema = z.object({
  name: z.string().min(3),
  title: z.string().min(3),
  description: z.string().min(10),
  openings: z.coerce.number().int().min(1),
  educationMinimum: z.enum(["fundamental", "medio", "tecnico", "superior", "pos", "mba", "mestrado", "doutorado"]),
  city: z.string().min(2),
  state: z.string().min(2).max(2),
  modality: z.enum(["presencial", "hibrido", "remoto"]),
  contractType: z.enum(["clt", "pj", "temporario", "estagio", "aprendiz"]),
  technicalSkills: z.string().optional(),
  requiredCourses: z.string().optional(),
  minimumExperienceMonths: z.coerce.number().int().min(0).optional()
});

const resumeProfileSchema = z.object({
  desiredRole: z.string().min(2),
  summary: z.string().max(1200).optional(),
  educationLevel: z.enum(["fundamental", "medio", "tecnico", "superior", "pos", "mba", "mestrado", "doutorado"]),
  availableInDays: z.coerce.number().int().min(0)
});

const resumePersonalSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  nationality: z.string().min(2),
  cpf: z.string().refine(isValidCpf, "cpf-invalido"),
  birthDate: z.string().refine((value) => ageFromBirthDate(value) >= 14, "idade-minima"),
  phone: z.string().refine(isValidBrazilianPhone, "telefone-invalido"),
  email: z.string().email(),
  cep: z.string().optional(),
  street: z.string().optional(),
  addressNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2).max(2)
});

const educationSchema = z.object({
  level: z.enum(["fundamental", "medio", "tecnico", "superior", "pos", "mba", "mestrado", "doutorado"]),
  institution: z.string().min(2),
  courseName: z.string().min(2),
  completedAt: z.string().optional()
});

const courseSchema = z.object({
  name: z.string().min(2),
  institution: z.string().optional(),
  workloadHours: z.coerce.number().int().min(0).optional(),
  completedAt: z.string().optional()
});

const languageSchema = z.object({
  languageName: z.string().min(2),
  proficiency: z.string().min(2)
});

const skillSchema = z.object({
  name: z.string().min(2),
  skillType: z.enum(["technical", "behavioral"]),
  proficiency: z.coerce.number().int().min(1).max(5)
});

const userSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  opportunityAlerts: z.boolean(),
  profileVisible: z.boolean(),
  allowRecruiterContact: z.boolean(),
  showSalaryExpectation: z.boolean(),
  redirectTo: z.string().optional()
});

const experienceSchema = z.object({
  companyName: z.string().min(2),
  roleTitle: z.string().min(2),
  startedAt: z.string().min(4),
  endedAt: z.string().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().min(10).max(1500)
});

function splitList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function imageExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function parsePreferredCity(value: FormDataEntryValue) {
  const [city, state] = String(value)
    .split("|")
    .map((item) => item.trim());

  if (!city || !state || state.length !== 2) return null;
  return { city, state: state.toUpperCase() };
}

function fallbackCompanyName(email?: string | null, fullName?: string | null) {
  const normalizedName = (fullName ?? "").trim();
  if (normalizedName.length >= 3) return normalizedName;

  const localPart = (email ?? "").split("@")[0]?.trim();
  if (localPart && localPart.length >= 3) return localPart;

  return "Empresa em configuracao";
}

function placeholderCnpj(userId: string) {
  return `PENDENTE-${userId.replace(/-/g, "").slice(0, 20)}`;
}

function encodeRouteMessage(route: string, key: "error" | "message", value: string) {
  const separator = route.includes("?") ? "&" : "?";
  return `${route}${separator}${key}=${encodeURIComponent(value)}`;
}

async function getProfessionalContext() {
  await requireRole("professional");
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: professional } = await supabase.from("professionals").select("id").eq("user_id", data.user.id).maybeSingle();
  if (!professional?.id) redirect("/professional/profile?error=complete-cadastro");

  return { supabase, user: data.user, professional };
}

export async function updateProfessionalProfileAction(formData: FormData) {
  await requireRole("professional");
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const desiredRole = String(formData.get("desiredRole") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase().slice(0, 2);
  const phone = String(formData.get("phone") ?? "");
  const availability = Number(formData.get("availableInDays") ?? 0);
  const avatar = formData.get("avatar");

  if (fullName.length < 3 || desiredRole.length < 2 || city.length < 2 || state.length !== 2 || !isValidBrazilianPhone(phone)) {
    redirect("/professional/profile?error=dados-invalidos");
  }

  const { data: professional } = await supabase.from("professionals").select("id").eq("user_id", data.user.id).maybeSingle();
  if (!professional?.id) redirect("/professional/profile?error=complete-cadastro");

  let avatarPath: string | null = null;
  if (avatar instanceof File && avatar.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(avatar.type) || avatar.size > 2 * 1024 * 1024) {
      redirect("/professional/profile?error=foto-invalida");
    }

    avatarPath = `${data.user.id}/perfil-${Date.now()}.${imageExtension(avatar.type)}`;
    const { error: avatarError } = await supabase.storage.from("avatars").upload(avatarPath, avatar, { upsert: true, contentType: avatar.type });
    if (avatarError) redirect(`/professional/profile?error=${encodeURIComponent(avatarError.message)}`);
  }

  const profilePayload: { full_name: string; phone: string; avatar_path?: string } = { full_name: fullName, phone: onlyDigits(phone) };
  if (avatarPath) profilePayload.avatar_path = avatarPath;

  await supabase.from("profiles").update(profilePayload).eq("id", data.user.id);
  await supabase
    .from("professionals")
    .update({
      full_name: fullName,
      desired_role: desiredRole,
      city,
      state,
      phone: onlyDigits(phone),
      available_in_days: Number.isFinite(availability) && availability >= 0 ? availability : 0
    })
    .eq("user_id", data.user.id);

  const preferredCities = formData
    .getAll("preferredCity")
    .map(parsePreferredCity)
    .filter((item): item is { city: string; state: string } => Boolean(item))
    .slice(0, 12);

  await supabase.from("professional_preferred_cities").delete().eq("professional_id", professional.id);
  if (preferredCities.length > 0) {
    await supabase.from("professional_preferred_cities").insert(preferredCities.map((item) => ({ professional_id: professional.id, city: item.city, state: item.state })));
  }

  revalidatePath("/professional/profile");
  revalidatePath("/professional");
  redirect("/professional/profile?message=perfil-atualizado");
}

export async function updateResumeProfileAction(formData: FormData) {
  const parsed = resumeProfileSchema.safeParse({
    desiredRole: formData.get("desiredRole"),
    summary: formData.get("summary"),
    educationLevel: formData.get("educationLevel"),
    availableInDays: formData.get("availableInDays")
  });

  if (!parsed.success) redirect("/professional/resume?error=dados-invalidos");

  const { supabase, user } = await getProfessionalContext();
  const data = parsed.data;

  await supabase
    .from("professionals")
    .update({
      desired_role: data.desiredRole,
      summary: data.summary ?? "",
      education_level: data.educationLevel,
      available_in_days: data.availableInDays
    })
    .eq("user_id", user.id);

  revalidatePath("/professional/resume");
  revalidatePath("/professional/profile");
  redirect("/professional/resume?message=curriculo-atualizado");
}

export async function updateResumePersonalAction(formData: FormData) {
  const parsed = resumePersonalSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    nationality: formData.get("nationality"),
    cpf: formData.get("cpf"),
    birthDate: formData.get("birthDate"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    cep: formData.get("cep"),
    street: formData.get("street"),
    addressNumber: formData.get("addressNumber"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state")
  });

  if (!parsed.success) redirect("/professional/resume?error=dados-pessoais-invalidos");

  const { supabase, user } = await getProfessionalContext();
  const data = parsed.data;
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  await supabase.from("profiles").update({ full_name: fullName, email: data.email, phone: onlyDigits(data.phone) }).eq("id", user.id);
  await supabase
    .from("professionals")
    .update({
      full_name: fullName,
      email: data.email,
      cpf: onlyDigits(data.cpf),
      birth_date: data.birthDate,
      phone: onlyDigits(data.phone),
      nationality: data.nationality,
      cep: data.cep ? onlyDigits(data.cep) : null,
      street: data.street || null,
      address_number: data.addressNumber || null,
      neighborhood: data.neighborhood || null,
      city: data.city,
      state: data.state.toUpperCase()
    })
    .eq("user_id", user.id);

  revalidatePath("/professional/resume");
  revalidatePath("/professional/profile");
  redirect("/professional/resume?message=dados-pessoais-atualizados");
}

export async function addProfessionalEducationAction(formData: FormData) {
  const parsed = educationSchema.safeParse({
    level: formData.get("level"),
    institution: formData.get("institution"),
    courseName: formData.get("courseName"),
    completedAt: formData.get("completedAt")
  });

  if (!parsed.success) redirect("/professional/resume?error=formacao-invalida");

  const { supabase, professional } = await getProfessionalContext();
  const data = parsed.data;

  await supabase.from("professional_educations").insert({
    professional_id: professional.id,
    level: data.level,
    institution: data.institution,
    course_name: data.courseName,
    completed_at: data.completedAt || null
  });

  revalidatePath("/professional/resume");
  redirect("/professional/resume?message=formacao-adicionada");
}

export async function addProfessionalCourseAction(formData: FormData) {
  const parsed = courseSchema.safeParse({
    name: formData.get("name"),
    institution: formData.get("institution"),
    workloadHours: formData.get("workloadHours"),
    completedAt: formData.get("completedAt")
  });

  if (!parsed.success) redirect("/professional/resume?error=curso-invalido");

  const { supabase, professional } = await getProfessionalContext();
  const data = parsed.data;

  await supabase.from("professional_courses").insert({
    professional_id: professional.id,
    name: data.name,
    institution: data.institution || null,
    workload_hours: data.workloadHours ?? null,
    completed_at: data.completedAt || null
  });

  revalidatePath("/professional/resume");
  redirect("/professional/resume?message=curso-adicionado");
}

export async function addProfessionalLanguageAction(formData: FormData) {
  const parsed = languageSchema.safeParse({
    languageName: formData.get("languageName"),
    proficiency: formData.get("proficiency")
  });

  if (!parsed.success) redirect("/professional/resume?error=idioma-invalido");

  const { supabase, professional } = await getProfessionalContext();
  await supabase.from("professional_languages").insert({
    professional_id: professional.id,
    language_name: parsed.data.languageName,
    proficiency: parsed.data.proficiency
  });

  revalidatePath("/professional/resume");
  redirect("/professional/resume?message=idioma-adicionado");
}

export async function addProfessionalSkillAction(formData: FormData) {
  const parsed = skillSchema.safeParse({
    name: formData.get("name"),
    skillType: formData.get("skillType"),
    proficiency: formData.get("proficiency")
  });

  if (!parsed.success) redirect("/professional/resume?error=habilidade-invalida");

  const { supabase, professional } = await getProfessionalContext();
  await supabase.from("professional_skills").insert({
    professional_id: professional.id,
    name: parsed.data.name,
    skill_type: parsed.data.skillType,
    proficiency: parsed.data.proficiency
  });

  revalidatePath("/professional/resume");
  redirect("/professional/resume?message=habilidade-adicionada");
}

export async function updateUserSettingsAction(formData: FormData) {
  const parsed = userSettingsSchema.safeParse({
    emailNotifications: formData.get("emailNotifications") === "on",
    opportunityAlerts: formData.get("opportunityAlerts") === "on",
    profileVisible: formData.get("profileVisible") === "on",
    allowRecruiterContact: formData.get("allowRecruiterContact") === "on",
    showSalaryExpectation: formData.get("showSalaryExpectation") === "on",
    redirectTo: formData.get("redirectTo")
  });

  if (!parsed.success) redirect("/professional/settings?error=dados-invalidos");

  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  await supabase.from("user_settings").upsert({
    user_id: data.user.id,
    email_notifications: parsed.data.emailNotifications,
    opportunity_alerts: parsed.data.opportunityAlerts,
    profile_visible: parsed.data.profileVisible,
    allow_recruiter_contact: parsed.data.allowRecruiterContact,
    show_salary_expectation: parsed.data.showSalaryExpectation
  });

  const redirectTo = parsed.data.redirectTo && parsed.data.redirectTo.startsWith("/professional/") ? parsed.data.redirectTo : "/professional/settings";
  revalidatePath("/professional/settings");
  revalidatePath("/professional/resume");
  redirect(`${redirectTo}?message=configuracoes-atualizadas`);
}

export async function addProfessionalExperienceAction(formData: FormData) {
  const parsed = experienceSchema.safeParse({
    companyName: formData.get("companyName"),
    roleTitle: formData.get("roleTitle"),
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt"),
    isCurrent: formData.get("isCurrent") === "on",
    description: formData.get("description")
  });

  if (!parsed.success) redirect("/professional/resume?error=experiencia-invalida");

  const { supabase, professional } = await getProfessionalContext();
  const data = parsed.data;

  await supabase.from("professional_experiences").insert({
    professional_id: professional.id,
    company_name: data.companyName,
    role_title: data.roleTitle,
    started_at: data.startedAt,
    ended_at: data.isCurrent ? null : data.endedAt || null,
    is_current: Boolean(data.isCurrent),
    description: data.description
  });

  revalidatePath("/professional/resume");
  redirect("/professional/resume?message=experiencia-adicionada");
}

export async function uploadProfessionalResumeAction(formData: FormData) {
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) redirect("/professional/resume?error=arquivo-obrigatorio");
  if (file.size > 5 * 1024 * 1024) redirect("/professional/resume?error=arquivo-maior-que-5mb");

  const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowedTypes.includes(file.type)) redirect("/professional/resume?error=formato-invalido");

  const { supabase, user, professional } = await getProfessionalContext();
  const extension = file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
  const path = `${user.id}/uploaded/curriculo-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("curriculums").upload(path, file, { upsert: true, contentType: file.type });
  if (error) redirect(`/professional/resume?error=${encodeURIComponent(error.message)}`);

  const { data: resume } = await supabase.from("resumes").upsert({ professional_id: professional.id }, { onConflict: "professional_id" }).select("id").single();
  if (resume?.id) {
    const { data: latestVersion } = await supabase.from("resume_versions").select("version").eq("resume_id", resume.id).order("version", { ascending: false }).limit(1).maybeSingle();
    const nextVersion = Number(latestVersion?.version ?? 0) + 1;
    const { data: version } = await supabase.from("resume_versions").insert({ resume_id: resume.id, version: nextVersion, storage_path: path }).select("id").single();
    if (version?.id) {
      await supabase.from("resumes").update({ active_version_id: version.id }).eq("id", resume.id);
    }
  }

  revalidatePath("/professional/resume");
  redirect("/professional/resume?message=curriculo-enviado");
}

export async function updateCompanyProfileAction(formData: FormData) {
  await requireRole("company");
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const cnpj = String(formData.get("cnpj") ?? "");
  const tradeName = String(formData.get("tradeName") ?? "").trim();
  const legalName = String(formData.get("legalName") ?? "").trim();
  const corporateEmail = String(formData.get("corporateEmail") ?? "").trim();
  const phone = String(formData.get("phone") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase().slice(0, 2);
  const segment = String(formData.get("segment") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactRole = String(formData.get("contactRole") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "");

  if (
    !isValidCnpj(cnpj) ||
    tradeName.length < 2 ||
    legalName.length < 3 ||
    !corporateEmail.includes("@") ||
    !isValidBrazilianPhone(phone) ||
    city.length < 2 ||
    state.length !== 2 ||
    segment.length < 2 ||
    contactName.length < 3 ||
    contactRole.length < 2 ||
    !isValidBrazilianPhone(contactPhone)
  ) {
    redirect("/company/profile?error=dados-invalidos");
  }

  const normalizedCnpj = onlyDigits(cnpj);
  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", data.user.id).maybeSingle();
  const { data: duplicatedCnpj } = await supabase.from("companies").select("id,owner_id").eq("cnpj", normalizedCnpj).neq("owner_id", data.user.id).maybeSingle();
  if (duplicatedCnpj) redirect("/company/profile?error=cnpj-ja-cadastrado");

  await supabase
    .from("companies")
    .update({
      cnpj: normalizedCnpj,
      trade_name: tradeName,
      legal_name: legalName,
      corporate_email: corporateEmail,
      phone: onlyDigits(phone),
      city,
      state,
      segment,
      description
    })
    .eq("owner_id", data.user.id);

  if (company?.id) {
    await supabase.from("company_contacts").delete().eq("company_id", company.id);
    await supabase.from("company_contacts").insert({
      company_id: company.id,
      name: contactName,
      email: corporateEmail,
      phone: onlyDigits(contactPhone),
      role_title: contactRole
    });
  }

  revalidatePath("/company/profile");
  revalidatePath("/company");
  redirect("/company/profile?message=empresa-atualizada");
}

export async function createDemandAction(formData: FormData) {
  await requireRole("company");
  const parsed = demandSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    description: formData.get("description"),
    openings: formData.get("openings"),
    educationMinimum: formData.get("educationMinimum"),
    city: formData.get("city"),
    state: formData.get("state"),
    modality: formData.get("modality"),
    contractType: formData.get("contractType"),
    technicalSkills: formData.get("technicalSkills"),
    requiredCourses: formData.get("requiredCourses"),
    minimumExperienceMonths: formData.get("minimumExperienceMonths")
  });

  if (!parsed.success) redirect("/company/demands/new?error=dados-invalidos");

  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const data = parsed.data;
  let { data: company } = await supabase.from("companies").select("id").eq("owner_id", userData.user.id).maybeSingle();

  if (!company?.id) {
    const { data: profile } = await supabase.from("profiles").select("full_name,email,phone").eq("id", userData.user.id).maybeSingle();
    const companyName = fallbackCompanyName(userData.user.email, profile?.full_name);
    const fallbackEmail = profile?.email?.trim() || userData.user.email || `empresa-${userData.user.id.slice(0, 8)}@pendente.local`;

    const { data: createdCompany, error: companyError } = await supabase
      .from("companies")
      .insert({
        owner_id: userData.user.id,
        legal_name: companyName,
        trade_name: companyName,
        cnpj: placeholderCnpj(userData.user.id),
        city: data.city,
        state: data.state.toUpperCase(),
        phone: profile?.phone ?? null,
        corporate_email: fallbackEmail,
        status: "pending"
      })
      .select("id")
      .single();

    if (companyError || !createdCompany?.id) {
      redirect(`/company/demands/new?error=${encodeURIComponent(companyError?.message ?? "empresa-nao-configurada")}`);
    }

    company = createdCompany;
  }

  const { error } = await supabase.from("demands").insert({
    company_id: company.id,
    name: data.name,
    title: data.title,
    description: data.description,
    openings: data.openings,
    education_minimum: data.educationMinimum,
    city: data.city,
    state: data.state.toUpperCase(),
    modality: data.modality,
    contract_type: data.contractType,
    technical_skills: splitList(data.technicalSkills),
    required_courses: splitList(data.requiredCourses),
    minimum_experience_months: data.minimumExperienceMonths ?? 0,
    status: "active"
  });

  if (error) redirect(`/company/demands/new?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/company/demands");
  revalidatePath("/company");
  redirect("/company/demands?message=demanda-criada");
}

export async function updateDemandAction(formData: FormData) {
  await requireRole("company");

  const demandId = String(formData.get("demandId") ?? "").trim();
  if (!demandId) redirect("/company/demands?error=demanda-invalida");

  const parsed = demandSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    description: formData.get("description"),
    openings: formData.get("openings"),
    educationMinimum: formData.get("educationMinimum"),
    city: formData.get("city"),
    state: formData.get("state"),
    modality: formData.get("modality"),
    contractType: formData.get("contractType"),
    technicalSkills: formData.get("technicalSkills"),
    requiredCourses: formData.get("requiredCourses"),
    minimumExperienceMonths: formData.get("minimumExperienceMonths")
  });

  if (!parsed.success) redirect(encodeRouteMessage(`/company/demands/${demandId}`, "error", "dados-invalidos"));

  const status = String(formData.get("status") ?? "").trim();
  if (!["draft", "active", "screening", "closed", "cancelled"].includes(status)) {
    redirect(encodeRouteMessage(`/company/demands/${demandId}`, "error", "status-invalido"));
  }

  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", userData.user.id).maybeSingle();
  if (!company?.id) redirect("/company/profile?error=complete-empresa");

  const { data: demand } = await supabase.from("demands").select("id").eq("id", demandId).eq("company_id", company.id).maybeSingle();
  if (!demand?.id) redirect("/company/demands?error=demanda-nao-encontrada");

  const data = parsed.data;
  const { error } = await supabase
    .from("demands")
    .update({
      name: data.name,
      title: data.title,
      description: data.description,
      openings: data.openings,
      education_minimum: data.educationMinimum,
      city: data.city,
      state: data.state.toUpperCase(),
      modality: data.modality,
      contract_type: data.contractType,
      technical_skills: splitList(data.technicalSkills),
      required_courses: splitList(data.requiredCourses),
      minimum_experience_months: data.minimumExperienceMonths ?? 0,
      status
    })
    .eq("id", demand.id);

  if (error) redirect(encodeRouteMessage(`/company/demands/${demandId}`, "error", error.message));

  revalidatePath("/company");
  revalidatePath("/company/demands");
  revalidatePath(`/company/demands/${demand.id}`);
  redirect(encodeRouteMessage(`/company/demands/${demand.id}`, "message", "demanda-atualizada"));
}

export async function deleteDemandAction(formData: FormData) {
  await requireRole("company");

  const demandId = String(formData.get("demandId") ?? "").trim();
  if (!demandId) redirect("/company/demands?error=demanda-invalida");

  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", userData.user.id).maybeSingle();
  if (!company?.id) redirect("/company/profile?error=complete-empresa");

  const { error } = await supabase
    .from("demands")
    .update({
      status: "cancelled",
      deleted_at: new Date().toISOString()
    })
    .eq("id", demandId)
    .eq("company_id", company.id);

  if (error) redirect(`/company/demands?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/company");
  revalidatePath("/company/demands");
  redirect("/company/demands?message=demanda-excluida");
}

export async function markNotificationsReadAction() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", data.user.id).is("read_at", null);
  revalidatePath("/professional/notifications");
  revalidatePath("/company/notifications");
}

export async function requestDataExportAction(formData: FormData) {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const requestType = String(formData.get("requestType") ?? "export");
  if (!["export", "partial_anonymization", "account_deletion"].includes(requestType)) redirect("/acesso-negado");

  await supabase.from("data_requests").insert({ user_id: data.user.id, request_type: requestType });
  revalidatePath("/professional/settings");
  revalidatePath("/company/settings");
}

export async function updateCompanyStatusAction(formData: FormData) {
  await requireRole("admin");
  const companyId = String(formData.get("companyId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!companyId || !["pending", "approved", "rejected", "suspended"].includes(status)) redirect("/admin/companies?error=dados-invalidos");

  const supabase = await createServerClient();
  await supabase.from("companies").update({ status }).eq("id", companyId);
  revalidatePath("/admin/companies");
}

export async function updateProfessionalStatusAction(formData: FormData) {
  await requireRole("admin");
  const professionalId = String(formData.get("professionalId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!professionalId || !["pending", "approved", "rejected", "suspended"].includes(status)) redirect("/admin/candidates?error=dados-invalidos");

  const supabase = await createServerClient();
  await supabase.from("professionals").update({ status }).eq("id", professionalId);
  revalidatePath("/admin/new-candidates");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/talent-bank");
}

export async function updateProcessStatusAction(formData: FormData) {
  await requireRole("admin");
  const processId = String(formData.get("processId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!processId || !["received", "analysis", "screening", "pre_approved", "training", "interview", "forwarded", "hired", "rejected", "waiting"].includes(status)) {
    redirect("/admin/referrals?error=dados-invalidos");
  }

  const supabase = await createServerClient();
  await supabase.from("screening_processes").update({ status }).eq("id", processId);
  revalidatePath("/admin/referrals");
  revalidatePath("/admin/hirings");
}
