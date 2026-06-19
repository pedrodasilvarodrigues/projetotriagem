"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/access";
import { ensureProfessionalPublicProfile } from "@/lib/auth/public-profile-sync";
import { cleanInstitutionName, normalizeInstitutionName } from "@/lib/institutions";
import { ensureInstitutionName } from "@/lib/institutions-server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
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

const adminDemandSchema = demandSchema.extend({
  companyId: z.string().uuid(),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  internalNotes: z.string().optional()
});

const resumeProfileSchema = z.object({
  desiredRole: z.string().min(2),
  summary: z.string().max(1200).optional(),
  educationLevel: z.enum(["fundamental", "medio", "tecnico", "superior", "pos", "mba", "mestrado", "doutorado"]),
  availableInDays: z.coerce.number().int().min(0)
});

const resumePersonalSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(1),
  nationality: z.string().trim().min(2),
  cpf: z.string().trim().refine(isValidCpf, "cpf-invalido"),
  birthDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "data-invalida").refine((value) => ageFromBirthDate(value) >= 14, "idade-minima"),
  phone: z.string().trim().refine(isValidBrazilianPhone, "telefone-invalido"),
  email: z.string().trim().toLowerCase().email(),
  cep: z.string().trim().refine((value) => value === "" || onlyDigits(value).length === 8, "cep-invalido"),
  street: z.string().trim().optional(),
  addressNumber: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().toUpperCase().length(2).regex(/^[A-Z]{2}$/, "estado-invalido")
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
  preferredLanguage: z.enum(["pt-BR", "en-US", "es-ES"]).default("pt-BR"),
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

function professionalFormError(route: "/professional/profile" | "/professional/resume", code: string, details?: Record<string, unknown>): never {
  console.warn("[professional-form] Operacao interrompida", { route, code, ...details });
  redirect(`${route}?error=${encodeURIComponent(code)}`);
}

async function callResumeRpc(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  fn: string,
  args: Record<string, unknown>,
  errorCode: string
) {
  const { error } = await supabase.rpc(fn, args);

  if (error) {
    professionalFormError("/professional/resume", errorCode, {
      rpc: fn,
      error: error.message,
      code: error.code
    });
  }
}

async function getProfessionalContext(errorRoute: "/professional/profile" | "/professional/resume" = "/professional/resume") {
  await requireRole("professional");
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  let { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();

  if (!professional?.id) {
    console.warn("[professional-form] Perfil nao visivel na primeira leitura", {
      userId: data.user.id,
      error: professionalError?.message ?? null
    });
    await ensureProfessionalPublicProfile(data.user);
    const retry = await supabase.from("professionals").select("id").eq("user_id", data.user.id).limit(1).maybeSingle();
    professional = retry.data;
    professionalError = retry.error;
  }

  if (!professional?.id && hasSupabaseAdminEnv()) {
    const adminResult = await createAdminClient().from("professionals").select("id").eq("user_id", data.user.id).limit(1).maybeSingle();
    professional = adminResult.data;
    professionalError = adminResult.error;
  }

  if (!professional?.id) {
    professionalFormError(errorRoute, "perfil-profissional-indisponivel", {
      userId: data.user.id,
      error: professionalError?.message ?? null
    });
  }

  return { supabase, user: data.user, professional };
}

export async function updateProfessionalProfileAction(formData: FormData) {
  await requireRole("professional");
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  await ensureProfessionalPublicProfile(data.user);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const cpf = String(formData.get("cpf") ?? "");
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const nationality = String(formData.get("nationality") ?? "").trim();
  const desiredRole = String(formData.get("desiredRole") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase().slice(0, 2);
  const phone = String(formData.get("phone") ?? "");
  const cep = String(formData.get("cep") ?? "");
  const street = String(formData.get("street") ?? "").trim();
  const addressNumber = String(formData.get("addressNumber") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const availability = Number(formData.get("availableInDays") ?? 0);
  const avatar = formData.get("avatar");
  const hasCpf = onlyDigits(cpf).length > 0;
  const normalizedCpf = hasCpf ? onlyDigits(cpf) : null;
  const hasCep = onlyDigits(cep).length > 0;

  if (fullName.length < 3) professionalFormError("/professional/profile", "nome-invalido");
  if (email.length > 0 && !z.string().email().safeParse(email).success) professionalFormError("/professional/profile", "email-invalido");
  if (hasCpf && !isValidCpf(cpf)) professionalFormError("/professional/profile", "cpf-invalido");
  if (birthDate.length > 0 && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || ageFromBirthDate(birthDate) < 14)) professionalFormError("/professional/profile", "data-invalida");
  if (nationality.length < 2) professionalFormError("/professional/profile", "nacionalidade-invalida");
  if (desiredRole.length < 2) professionalFormError("/professional/profile", "cargo-invalido");
  if (city.length < 2 || !/^[A-Z]{2}$/.test(state)) professionalFormError("/professional/profile", "localizacao-invalida");
  if (!isValidBrazilianPhone(phone)) professionalFormError("/professional/profile", "telefone-invalido");
  if (hasCep && onlyDigits(cep).length !== 8) professionalFormError("/professional/profile", "cep-invalido");
  if ((street.length > 0 && street.length < 2) || (neighborhood.length > 0 && neighborhood.length < 2)) professionalFormError("/professional/profile", "endereco-invalido");

  let { data: professional, error: professionalReadError } = await supabase
    .from("professionals")
    .select("id,email,cpf,birth_date,nationality,cep,street,address_number,neighborhood")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();

  if (!professional?.id && hasSupabaseAdminEnv()) {
    const retry = await createAdminClient()
      .from("professionals")
      .select("id,email,cpf,birth_date,nationality,cep,street,address_number,neighborhood")
      .eq("user_id", data.user.id)
      .limit(1)
      .maybeSingle();
    professional = retry.data;
    professionalReadError = retry.error;
  }

  if (professionalReadError) {
    console.warn("[professional-form] Falha ao carregar perfil antes de salvar", {
      userId: data.user.id,
      error: professionalReadError.message
    });
  }

  if (normalizedCpf && normalizedCpf !== professional?.cpf) {
    const { data: duplicatedCpf } = await supabase.from("professionals").select("id,user_id").eq("cpf", normalizedCpf).neq("user_id", data.user.id).maybeSingle();
    if (duplicatedCpf) redirect("/professional/profile?error=cpf-ja-cadastrado");
  }

  let avatarPath: string | null = null;
  if (avatar instanceof File && avatar.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(avatar.type) || avatar.size > 2 * 1024 * 1024) {
      redirect("/professional/profile?error=foto-invalida");
    }

    avatarPath = `${data.user.id}/perfil-${Date.now()}.${imageExtension(avatar.type)}`;
    const { error: avatarError } = await supabase.storage.from("avatars").upload(avatarPath, avatar, { upsert: true, contentType: avatar.type });
    if (avatarError) redirect(`/professional/profile?error=${encodeURIComponent(avatarError.message)}`);
  }

  const emailForProfile = email || professional?.email || data.user.email || null;
  const profilePayload: { id: string; full_name: string; phone: string; email?: string; avatar_path?: string } = { id: data.user.id, full_name: fullName, phone: onlyDigits(phone) };
  if (emailForProfile) profilePayload.email = emailForProfile;
  if (avatarPath) profilePayload.avatar_path = avatarPath;

  const professionalPayload: Record<string, string | number | null> = {
    user_id: data.user.id,
    full_name: fullName,
    desired_role: desiredRole,
    city,
    state,
    phone: onlyDigits(phone),
    available_in_days: Number.isFinite(availability) && availability >= 0 ? availability : 0,
    education_level: "medio",
    status: "pending",
    nationality: nationality || professional?.nationality || "Brasileira",
    cep: hasCep ? onlyDigits(cep) : professional?.cep ?? null,
    street: street || professional?.street || null,
    address_number: addressNumber || professional?.address_number || null,
    neighborhood: neighborhood || professional?.neighborhood || null
  };
  if (emailForProfile) professionalPayload.email = emailForProfile;
  if (normalizedCpf || professional?.cpf) professionalPayload.cpf = normalizedCpf ?? professional?.cpf ?? null;
  if (birthDate || professional?.birth_date) professionalPayload.birth_date = birthDate || (professional?.birth_date ?? null);

  let { error: profileError } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
  if (profileError && hasSupabaseAdminEnv()) {
    const retry = await createAdminClient().from("profiles").upsert(profilePayload, { onConflict: "id" });
    profileError = retry.error;
  }
  if (profileError) professionalFormError("/professional/profile", "erro-ao-salvar-perfil", { userId: data.user.id, error: profileError.message });
  if (!professional?.id) {
    let { data: createdProfessional, error: createError } = await supabase.from("professionals").insert(professionalPayload).select("id").single();
    if ((createError || !createdProfessional?.id) && hasSupabaseAdminEnv()) {
      const retry = await createAdminClient().from("professionals").insert(professionalPayload).select("id").single();
      createdProfessional = retry.data;
      createError = retry.error;
    }
    if (createError || !createdProfessional?.id) {
      professionalFormError("/professional/profile", "perfil-nao-criado", { userId: data.user.id, error: createError?.message ?? null });
    }
    professional = { ...professionalPayload, id: createdProfessional.id } as typeof professional;
  } else {
    const { education_level: _educationLevel, status: _status, user_id: _userId, ...updatePayload } = professionalPayload;
    let { error: updateError } = await supabase.from("professionals").update(updatePayload).eq("user_id", data.user.id);
    if (updateError && hasSupabaseAdminEnv()) {
      const retry = await createAdminClient().from("professionals").update(updatePayload).eq("user_id", data.user.id);
      updateError = retry.error;
    }
    if (updateError) professionalFormError("/professional/profile", "erro-ao-salvar-profissional", { userId: data.user.id, error: updateError.message });
  }
  const professionalId = professional?.id;
  if (!professionalId) redirect("/professional/profile?error=perfil-nao-criado");

  const preferredCities = formData
    .getAll("preferredCity")
    .map(parsePreferredCity)
    .filter((item): item is { city: string; state: string } => Boolean(item))
    .slice(0, 12);

  await supabase.from("professional_preferred_cities").delete().eq("professional_id", professionalId);
  if (preferredCities.length > 0) {
    await supabase.from("professional_preferred_cities").insert(preferredCities.map((item) => ({ professional_id: professionalId, city: item.city, state: item.state })));
  }

  revalidatePath("/professional/profile");
  revalidatePath("/professional/resume");
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

  const { error: updateError } = await supabase.rpc("update_professional_resume_profile", {
    desired_role_input: data.desiredRole,
    summary_input: data.summary ?? "",
    education_level_input: data.educationLevel,
    available_in_days_input: data.availableInDays
  });
  if (updateError) professionalFormError("/professional/resume", "erro-ao-salvar-profissional", { userId: user.id, error: updateError.message });

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

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue?.path[0] ?? "dados");
    const knownCodes = new Set(["cpf-invalido", "data-invalida", "idade-minima", "telefone-invalido", "cep-invalido", "estado-invalido"]);
    const code = issue?.message && knownCodes.has(issue.message) ? issue.message : `${field}-invalido`;
    professionalFormError("/professional/resume", code, { field });
  }

  const { supabase, user } = await getProfessionalContext();
  const data = parsed.data;
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  const { data: duplicatedCpf } = await supabase
    .from("professionals")
    .select("id,user_id")
    .eq("cpf", onlyDigits(data.cpf))
    .neq("user_id", user.id)
    .maybeSingle();
  if (duplicatedCpf) professionalFormError("/professional/resume", "cpf-ja-cadastrado", { userId: user.id });

  const profilePayload = { id: user.id, full_name: fullName, email: data.email, phone: onlyDigits(data.phone) };
  let { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });
  if (profileError && hasSupabaseAdminEnv()) {
    const retry = await createAdminClient().from("profiles").upsert(profilePayload, { onConflict: "id" });
    profileError = retry.error;
  }
  if (profileError) professionalFormError("/professional/resume", "erro-ao-salvar-perfil", { userId: user.id, error: profileError.message });

  const personalPayload = {
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
    state: data.state
  };
  let { error: professionalError } = await supabase
    .from("professionals")
    .update(personalPayload)
    .eq("user_id", user.id);
  if (professionalError && hasSupabaseAdminEnv()) {
    const retry = await createAdminClient().from("professionals").update(personalPayload).eq("user_id", user.id);
    professionalError = retry.error;
  }
  if (professionalError) professionalFormError("/professional/resume", "erro-ao-salvar-profissional", { userId: user.id, error: professionalError.message });

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

  const { supabase, user } = await getProfessionalContext();
  const data = parsed.data;
  const institutionName = await ensureInstitutionName(supabase, user.id, data.institution);

  await callResumeRpc(supabase, "add_professional_education", {
    level_input: data.level,
    institution_input: institutionName ?? data.institution,
    course_name_input: data.courseName,
    completed_at_input: data.completedAt || null
  }, "erro-ao-salvar-formacao");

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

  const { supabase, user } = await getProfessionalContext();
  const data = parsed.data;
  const institutionName = await ensureInstitutionName(supabase, user.id, data.institution);

  await callResumeRpc(supabase, "add_professional_course", {
    name_input: data.name,
    institution_input: institutionName || null,
    workload_hours_input: data.workloadHours ?? null,
    completed_at_input: data.completedAt || null
  }, "erro-ao-salvar-curso");

  revalidatePath("/professional/resume");
  redirect("/professional/resume?message=curso-adicionado");
}

export async function addProfessionalLanguageAction(formData: FormData) {
  const parsed = languageSchema.safeParse({
    languageName: formData.get("languageName"),
    proficiency: formData.get("proficiency")
  });

  if (!parsed.success) redirect("/professional/resume?error=idioma-invalido");

  const { supabase } = await getProfessionalContext();
  await callResumeRpc(supabase, "add_professional_language", {
    language_name_input: parsed.data.languageName,
    proficiency_input: parsed.data.proficiency
  }, "erro-ao-salvar-idioma");

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

  const { supabase } = await getProfessionalContext();
  await callResumeRpc(supabase, "add_professional_skill", {
    name_input: parsed.data.name,
    skill_type_input: parsed.data.skillType,
    proficiency_input: parsed.data.proficiency
  }, "erro-ao-salvar-habilidade");

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
    preferredLanguage: formData.get("preferredLanguage") ?? "pt-BR",
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
    show_salary_expectation: parsed.data.showSalaryExpectation,
    preferred_language: parsed.data.preferredLanguage
  });

  const redirectTo =
    parsed.data.redirectTo && (parsed.data.redirectTo.startsWith("/professional/") || parsed.data.redirectTo.startsWith("/company/"))
      ? parsed.data.redirectTo
      : "/professional/settings";
  revalidatePath("/professional/settings");
  revalidatePath("/professional/resume");
  revalidatePath("/company/settings");
  revalidatePath("/company");
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

  const { supabase } = await getProfessionalContext();
  const data = parsed.data;

  await callResumeRpc(supabase, "add_professional_experience", {
    company_name_input: data.companyName,
    role_title_input: data.roleTitle,
    started_at_input: data.startedAt,
    ended_at_input: data.isCurrent ? null : data.endedAt || null,
    is_current_input: Boolean(data.isCurrent),
    description_input: data.description
  }, "erro-ao-salvar-experiencia");

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
  const cep = String(formData.get("cep") ?? "");
  const street = String(formData.get("street") ?? "").trim();
  const addressNumber = String(formData.get("addressNumber") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase().slice(0, 2);
  const segment = String(formData.get("segment") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactRole = String(formData.get("contactRole") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase();
  const contactPhone = String(formData.get("contactPhone") ?? "");

  const hasCnpj = cnpj.trim().length > 0;
  const hasCorporateEmail = corporateEmail.length > 0;
  const hasPhone = onlyDigits(phone).length > 0;
  const hasCep = onlyDigits(cep).length > 0;
  const hasContactEmail = contactEmail.length > 0;
  const hasContactPhone = onlyDigits(contactPhone).length > 0;

  if (
    (hasCnpj && !isValidCnpj(cnpj)) ||
    (tradeName.length > 0 && tradeName.length < 2) ||
    (legalName.length > 0 && legalName.length < 3) ||
    (hasCorporateEmail && !corporateEmail.includes("@")) ||
    (hasPhone && !isValidBrazilianPhone(phone)) ||
    (hasCep && onlyDigits(cep).length !== 8) ||
    (street.length > 0 && street.length < 2) ||
    (neighborhood.length > 0 && neighborhood.length < 2) ||
    (city.length > 0 && city.length < 2) ||
    (state.length > 0 && state.length !== 2) ||
    (segment.length > 0 && segment.length < 2) ||
    (contactName.length > 0 && contactName.length < 3) ||
    (contactRole.length > 0 && contactRole.length < 2) ||
    (hasContactEmail && !z.string().email().safeParse(contactEmail).success) ||
    (hasContactPhone && !isValidBrazilianPhone(contactPhone))
  ) {
    redirect("/company/profile?error=dados-invalidos");
  }

  const normalizedCnpj = hasCnpj ? onlyDigits(cnpj) : null;
  let { data: company } = await supabase.from("companies").select("id,cnpj,trade_name,legal_name,corporate_email,phone,cep,street,address_number,neighborhood,city,state,segment,description").eq("owner_id", data.user.id).maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("full_name,email,phone").eq("id", data.user.id).maybeSingle();
  if (normalizedCnpj) {
    const { data: duplicatedCnpj } = await supabase.from("companies").select("id,owner_id").eq("cnpj", normalizedCnpj).neq("owner_id", data.user.id).maybeSingle();
    if (duplicatedCnpj) redirect("/company/profile?error=cnpj-ja-cadastrado");
  }

  const fallbackName = fallbackCompanyName(data.user.email, profile?.full_name);
  const finalLegalName = legalName || company?.legal_name || company?.trade_name || fallbackName;
  const finalTradeName = tradeName || company?.trade_name || company?.legal_name || fallbackName;
  const finalCorporateEmail = corporateEmail || company?.corporate_email || profile?.email || data.user.email || `empresa-${data.user.id.slice(0, 8)}@pendente.local`;
  const finalContactEmail = contactEmail || finalCorporateEmail;
  const finalContactPhone = hasContactPhone ? onlyDigits(contactPhone) : profile?.phone || null;
  const companyPayload = {
    cnpj: normalizedCnpj ?? company?.cnpj ?? placeholderCnpj(data.user.id),
    trade_name: finalTradeName,
    legal_name: finalLegalName,
    corporate_email: finalCorporateEmail,
    phone: hasPhone ? onlyDigits(phone) : company?.phone ?? profile?.phone ?? null,
    cep: hasCep ? onlyDigits(cep) : company?.cep ?? null,
    street: street || company?.street || null,
    address_number: addressNumber || company?.address_number || null,
    neighborhood: neighborhood || company?.neighborhood || null,
    city: city || company?.city || "",
    state: state || company?.state || "",
    segment: segment || company?.segment || null,
    description: description || company?.description || null
  };

  if (!company?.id) {
    const { data: createdCompany, error: companyError } = await supabase
      .from("companies")
      .insert({
        owner_id: data.user.id,
        ...companyPayload,
        status: "pending"
      })
      .select("id")
      .single();

    if (companyError || !createdCompany?.id) {
      redirect(`/company/profile?error=${encodeURIComponent(companyError?.message ?? "empresa-nao-criada")}`);
    }

    company = { ...companyPayload, id: createdCompany.id };
  } else {
    await supabase.from("companies").update(companyPayload).eq("owner_id", data.user.id);
  }

  await supabase
    .from("profiles")
    .update({
      full_name: contactName || profile?.full_name || finalTradeName,
      email: finalContactEmail,
      phone: finalContactPhone
    })
    .eq("id", data.user.id);

  if (company.id) {
    await supabase.from("company_contacts").delete().eq("company_id", company.id);
    if (contactName || contactRole || hasContactPhone || hasContactEmail || finalCorporateEmail) {
      await supabase.from("company_contacts").insert({
        company_id: company.id,
        name: contactName || "Responsavel da empresa",
        email: finalContactEmail,
        phone: finalContactPhone,
        role_title: contactRole || null
      });
    }
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
  revalidatePath("/professional");
  revalidatePath("/professional/search-demands");
  revalidatePath("/vagas-publicas");
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
  revalidatePath("/professional");
  revalidatePath("/professional/search-demands");
  revalidatePath("/vagas-publicas");
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
  revalidatePath("/professional");
  revalidatePath("/professional/search-demands");
  revalidatePath("/vagas-publicas");
  redirect("/company/demands?message=demanda-excluida");
}

export async function closeDemandAction(formData: FormData) {
  await requireRole("company");

  const demandId = String(formData.get("demandId") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/company/demands");
  if (!demandId) redirect(encodeRouteMessage(redirectTo, "error", "demanda-invalida"));

  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: company } = await supabase.from("companies").select("id").eq("owner_id", userData.user.id).maybeSingle();
  if (!company?.id) redirect("/company/profile?error=complete-empresa");

  const { data: closedDemand, error } = await supabase
    .from("demands")
    .update({ status: "closed", deleted_at: null })
    .eq("id", demandId)
    .eq("company_id", company.id)
    .neq("status", "cancelled")
    .select("id")
    .maybeSingle();

  if (error || !closedDemand?.id) {
    redirect(encodeRouteMessage(redirectTo, "error", error?.message ?? "demanda-nao-encontrada"));
  }

  revalidatePath("/company");
  revalidatePath("/company/demands");
  revalidatePath(`/company/demands/${demandId}`);
  revalidatePath("/company/candidates");
  revalidatePath("/professional");
  revalidatePath("/professional/search-demands");
  revalidatePath("/vagas-publicas");
  redirect(encodeRouteMessage(redirectTo, "message", "demanda-encerrada"));
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
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/companies");
  if (!companyId || !["pending", "approved", "rejected", "suspended"].includes(status)) redirect(`${redirectTo}?error=dados-invalidos`);

  const supabase = await createServerClient();
  await supabase.from("companies").update({ status, deleted_at: null }).eq("id", companyId);
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`${redirectTo}?message=empresa-atualizada`);
}

export async function updateProfessionalStatusAction(formData: FormData) {
  await requireRole("admin");
  const professionalId = String(formData.get("professionalId") ?? "");
  const status = String(formData.get("status") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/professionals");
  if (!professionalId || !["pending", "approved", "rejected", "suspended"].includes(status)) redirect(`${redirectTo}?error=dados-invalidos`);

  const supabase = await createServerClient();
  await supabase.from("professionals").update({ status, deleted_at: null }).eq("id", professionalId);
  revalidatePath("/admin/professionals");
  revalidatePath("/admin/new-candidates");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/talent-bank");
  revalidatePath(`/admin/professionals/${professionalId}`);
  redirect(`${redirectTo}?message=profissional-atualizado`);
}

export async function archiveProfessionalAction(formData: FormData) {
  await requireRole("admin");
  const professionalId = String(formData.get("professionalId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/professionals");
  if (!professionalId) redirect(`${redirectTo}?error=dados-invalidos`);
  const supabase = await createServerClient();
  await supabase.from("professionals").update({ deleted_at: new Date().toISOString(), status: "suspended" }).eq("id", professionalId);
  revalidatePath("/admin/professionals");
  revalidatePath(`/admin/professionals/${professionalId}`);
  redirect(`${redirectTo}?message=profissional-arquivado`);
}

export async function archiveCompanyAction(formData: FormData) {
  await requireRole("admin");
  const companyId = String(formData.get("companyId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/companies");
  if (!companyId) redirect(`${redirectTo}?error=dados-invalidos`);
  const supabase = await createServerClient();
  await supabase.from("companies").update({ deleted_at: new Date().toISOString(), status: "suspended" }).eq("id", companyId);
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`${redirectTo}?message=empresa-arquivada`);
}

export async function presentProfessionalToCompanyAction(formData: FormData) {
  await requireRole("admin");
  const professionalId = String(formData.get("professionalId") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/professionals");
  if (!professionalId || !companyId) redirect(`${redirectTo}?error=dados-invalidos`);

  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase.from("professional_presentations").upsert({
    professional_id: professionalId,
    company_id: companyId,
    admin_id: userData.user.id,
    status: "presented",
    notes: notes || null,
    presented_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: "professional_id,company_id" });

  if (error) redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/professionals");
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/professionals/${professionalId}`);
  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`${redirectTo}?message=profissional-apresentado`);
}

export async function routeProfessionalToDemandAction(formData: FormData) {
  await requireRole("admin");
  const professionalId = String(formData.get("professionalId") ?? "");
  const demandId = String(formData.get("demandId") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/demands");
  if (!professionalId || !demandId || !["present", "queue"].includes(mode)) redirect(`${redirectTo}?error=dados-invalidos`);

  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const status = mode === "present" ? "forwarded" : "waiting";
  const { error } = await supabase.from("screening_processes").upsert({
    demand_id: demandId,
    professional_id: professionalId,
    status,
    admin_owner_id: userData.user.id,
    updated_at: new Date().toISOString()
  }, { onConflict: "demand_id,professional_id" });

  if (error) redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  if (mode === "present") {
    await supabase.from("demands").update({ status: "screening" }).eq("id", demandId).in("status", ["draft", "active"]);
  }
  revalidatePath("/admin/demands");
  revalidatePath("/admin/processes");
  revalidatePath("/admin/referrals");
  revalidatePath("/admin/professionals");
  revalidatePath(`/admin/professionals/${professionalId}`);
  redirect(`${redirectTo}?message=${mode === "present" ? "profissional-apresentado" : "profissional-na-fila"}`);
}

export async function createAdminDemandAction(formData: FormData) {
  await requireRole("admin");
  const parsed = adminDemandSchema.safeParse({
    companyId: formData.get("companyId"),
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
    minimumExperienceMonths: formData.get("minimumExperienceMonths"),
    salaryMin: formData.get("salaryMin"),
    salaryMax: formData.get("salaryMax"),
    internalNotes: formData.get("internalNotes")
  });
  if (!parsed.success) redirect("/admin/demands?error=dados-invalidos");

  const data = parsed.data;
  const supabase = await createServerClient();
  const { error } = await supabase.from("demands").insert({
    company_id: data.companyId,
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
    salary_min: data.salaryMin ?? null,
    salary_max: data.salaryMax ?? null,
    internal_notes: data.internalNotes || null,
    status: "active"
  });
  if (error) redirect(`/admin/demands?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/demands");
  revalidatePath("/professional");
  revalidatePath("/professional/search-demands");
  redirect("/admin/demands?message=demanda-criada");
}

export async function updateAdminDemandStatusAction(formData: FormData) {
  await requireRole("admin");
  const demandId = String(formData.get("demandId") ?? "");
  const status = String(formData.get("status") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/demands");
  if (!demandId || !["draft", "active", "screening", "closed", "cancelled"].includes(status)) redirect(`${redirectTo}?error=dados-invalidos`);
  const supabase = await createServerClient();
  await supabase.from("demands").update({ status, deleted_at: status === "cancelled" ? new Date().toISOString() : null }).eq("id", demandId);
  revalidatePath("/admin/demands");
  revalidatePath("/professional");
  revalidatePath("/professional/search-demands");
  redirect(`${redirectTo}?message=demanda-atualizada`);
}

export async function updateProcessStatusAction(formData: FormData) {
  await requireRole("admin");
  const processId = String(formData.get("processId") ?? "");
  const status = String(formData.get("status") ?? "");
  const companyResult = String(formData.get("companyResult") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/processes");
  if (!processId || !["received", "analysis", "screening", "pre_approved", "training", "interview", "forwarded", "hired", "rejected", "waiting"].includes(status)) {
    redirect(`${redirectTo}?error=dados-invalidos`);
  }

  const supabase = await createServerClient();
  await supabase.from("screening_processes").update({ status, company_result: companyResult || null }).eq("id", processId);
  revalidatePath("/admin/processes");
  revalidatePath("/admin/referrals");
  revalidatePath("/admin/hirings");
  redirect(`${redirectTo}?message=processo-atualizado`);
}

export async function updateInstitutionAction(formData: FormData) {
  await requireRole("admin");
  const institutionId = String(formData.get("institutionId") ?? "");
  const name = cleanInstitutionName(String(formData.get("name") ?? ""));
  const status = String(formData.get("status") ?? "");
  if (!institutionId || name.length < 2 || !["active", "pending", "archived"].includes(status)) redirect("/admin/institutions?error=dados-invalidos");

  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase
    .from("institutions")
    .update({
      name,
      normalized_name: normalizeInstitutionName(name),
      status,
      approved_by: status === "active" ? userData.user.id : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", institutionId);

  if (error) redirect(`/admin/institutions?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/institutions");
  redirect("/admin/institutions?message=instituicao-atualizada");
}

export async function deleteInstitutionAction(formData: FormData) {
  await requireRole("admin");
  const institutionId = String(formData.get("institutionId") ?? "");
  if (!institutionId) redirect("/admin/institutions?error=dados-invalidos");

  const supabase = await createServerClient();
  const { error } = await supabase.from("institutions").delete().eq("id", institutionId);
  if (error) redirect(`/admin/institutions?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/institutions");
  redirect("/admin/institutions?message=instituicao-excluida");
}
