"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/resend/send-email";
import { createServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";
import { ageFromBirthDate, isValidBrazilianPhone, isValidCnpj, isValidCpf, onlyDigits } from "@/lib/validations/br";

const minimumAge = Number(process.env.MINIMUM_PROFESSIONAL_AGE ?? 14);
const productionAppUrl = "https://projetotriagem.vercel.app";

const emailPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6)
});

const emailOnlySchema = z.object({
  email: z.string().trim().toLowerCase().email()
});

const optionalEmailSchema = z.preprocess((value) => {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  return text.length > 0 ? text : undefined;
}, z.string().email().optional());

const passwordUpdateSchema = z
  .object({
    password: z.string().min(6),
    confirmPassword: z.string().min(6)
  })
  .refine((data) => data.password === data.confirmPassword, "senhas-nao-conferem");

const professionalRegistrationSchema = emailPasswordSchema
  .extend({
    fullName: z.string().min(3).regex(/^[\p{L}\s]+$/u),
    cpf: z.string().refine(isValidCpf, "cpf-invalido"),
    phone: z.string().refine(isValidBrazilianPhone, "telefone-invalido"),
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

type ProfessionalRegistration = z.infer<typeof professionalRegistrationSchema>;

const companyRegistrationSchema = emailPasswordSchema.extend({
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

type CompanyRegistration = z.infer<typeof companyRegistrationSchema>;

function normalizeOrigin(value?: string | null) {
  if (!value) return null;
  const withProtocol = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(value: string) {
  const hostname = new URL(value).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function getAuthRedirectOrigin() {
  const headerStore = await headers();
  const candidates = [
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL),
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    normalizeOrigin(process.env.VERCEL_URL),
    normalizeOrigin(headerStore.get("origin")),
    productionAppUrl
  ].filter((value): value is string => Boolean(value));

  return candidates.find((value) => !isLocalOrigin(value)) ?? productionAppUrl;
}

async function getRequestMeta() {
  const headerStore = await headers();
  return {
    ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0] ?? null,
    userAgent: headerStore.get("user-agent")
  };
}

function canUseAdminClient() {
  return hasSupabaseAdminEnv();
}

function canSendBrandedAuthEmail() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && canUseAdminClient());
}

function authErrorCode(error?: { message?: string | null; status?: number | null; code?: string | null } | null) {
  const message = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();

  if (message.includes("invalid api key") || message.includes("api key")) {
    return "configuracao-supabase-incompleta";
  }

  if (error?.status === 429 || message.includes("rate limit") || message.includes("security purposes") || message.includes("too many requests")) {
    return "aguarde-um-minuto";
  }

  if (message.includes("email not confirmed") || message.includes("email_not_confirmed")) {
    return "email-nao-confirmado";
  }

  if (message.includes("invalid login credentials")) {
    return "credenciais-invalidas";
  }

  if (message.includes("already confirmed") || message.includes("already been confirmed")) {
    return "email-ja-confirmado";
  }

  return "erro-autenticacao";
}

function signupErrorCode(error?: { message?: string | null; status?: number | null; code?: string | null } | null) {
  const message = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();

  if (message.includes("invalid api key") || message.includes("api key")) {
    return "configuracao-supabase-incompleta";
  }

  if (message.includes("already") || message.includes("registered") || message.includes("exists") || message.includes("user_already_exists")) {
    return "email-ja-cadastrado";
  }

  if (message.includes("password")) {
    return "senha-invalida";
  }

  return "nao-foi-possivel-criar-conta";
}

function logAuth(event: string, details?: Record<string, unknown>) {
  console.log(`[auth] ${event}`, details ?? {});
}

function logAuthError(event: string, error: unknown, details?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[auth] ${event}`, { ...details, error: message });
}

async function findAuthUserByEmail(client: ReturnType<typeof createAdminClient>, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return null;

      const user = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);
      if (user) return user;
      if (data.users.length < 1000) return null;
    }
  } catch {
    return null;
  }

  return null;
}

async function confirmAuthEmailByAddress(email: string) {
  if (!canUseAdminClient()) return false;

  try {
    const admin = createAdminClient();
    const authUser = await findAuthUserByEmail(admin, email);
    if (!authUser?.id) return false;

    const { error } = await admin.auth.admin.updateUserById(authUser.id, { email_confirm: true });
    return !error;
  } catch {
    return false;
  }
}

async function saveProfessionalSignup(client: ReturnType<typeof createAdminClient>, userId: string, data: ProfessionalRegistration) {
  const normalizedCpf = onlyDigits(data.cpf);
  const normalizedPhone = onlyDigits(data.phone);
  const { ipAddress, userAgent } = await getRequestMeta();

  const { data: duplicatedCpf } = await client.from("professionals").select("id,user_id").eq("cpf", normalizedCpf).neq("user_id", userId).maybeSingle();
  if (duplicatedCpf) redirect("/register?error=cpf-ja-cadastrado");

  await client.from("profiles").upsert({
    id: userId,
    full_name: data.fullName,
    email: data.email,
    phone: normalizedPhone,
    status: "pending"
  });

  await client.from("user_roles").upsert({ user_id: userId, role: "professional" });

  const { error: professionalError } = await client.from("professionals").upsert(
    {
      user_id: userId,
      full_name: data.fullName,
      email: data.email,
      cpf: normalizedCpf,
      phone: normalizedPhone,
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
    },
    { onConflict: "user_id" }
  );

  if (professionalError) redirect(`/register?error=${encodeURIComponent(professionalError.message)}`);

  await client.from("consent_records").insert({
    user_id: userId,
    terms_version: "2026-06-03",
    privacy_version: "2026-06-03",
    ip_address: ipAddress,
    user_agent: userAgent
  });
}

async function saveCompanySignup(client: ReturnType<typeof createAdminClient>, userId: string, data: CompanyRegistration) {
  const normalizedCnpj = onlyDigits(data.cnpj);
  const normalizedPhone = onlyDigits(data.phone);
  const normalizedContactPhone = onlyDigits(data.contactPhone);
  const corporateEmail = data.corporateEmail ?? data.email;
  const { ipAddress, userAgent } = await getRequestMeta();

  const { data: duplicatedCnpj } = await client.from("companies").select("id,owner_id").eq("cnpj", normalizedCnpj).neq("owner_id", userId).maybeSingle();
  if (duplicatedCnpj) redirect("/register?type=company&error=cnpj-ja-cadastrado");

  await client.from("profiles").upsert({
    id: userId,
    full_name: data.contactName,
    email: data.email,
    phone: normalizedContactPhone,
    status: "pending"
  });

  await client.from("user_roles").upsert({ user_id: userId, role: "company" });

  const { data: company, error } = await client
    .from("companies")
    .upsert(
      {
        owner_id: userId,
        legal_name: data.legalName,
        trade_name: data.tradeName,
        cnpj: normalizedCnpj,
        phone: normalizedPhone,
        corporate_email: corporateEmail,
        cep: onlyDigits(data.cep),
        street: data.street,
        address_number: data.addressNumber,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state.toUpperCase(),
        status: "pending"
      },
      { onConflict: "cnpj" }
    )
    .select("id")
    .single();

  if (error || !company?.id) {
    redirect(`/register?type=company&error=${encodeURIComponent(error?.message ?? "empresa-nao-criada")}`);
  }

  await client.from("company_contacts").delete().eq("company_id", company.id);
  await client.from("company_contacts").insert({
    company_id: company.id,
    name: data.contactName,
    email: corporateEmail,
    phone: normalizedContactPhone,
    role_title: data.contactRole
  });

  await client.from("consent_records").insert({
    user_id: userId,
    terms_version: "2026-06-03",
    privacy_version: "2026-06-03",
    ip_address: ipAddress,
    user_agent: userAgent
  });
}

export async function signInWithGoogleAction(formData?: FormData) {
  if (!hasSupabasePublicEnv()) redirect("/login?error=configuracao-supabase-incompleta");

  try {
    const supabase = await createServerClient();
    const origin = await getAuthRedirectOrigin();
    const accountType = formData instanceof FormData ? String(formData.get("accountType") ?? "") : "";
    const signupRole = accountType === "professional" || accountType === "company" ? accountType : "";
    const callbackUrl = new URL(`${origin}/auth/callback`);
    if (signupRole) callbackUrl.searchParams.set("signupRole", signupRole);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: "select_account",
          access_type: "offline"
        }
      }
    });

    if (error || !data.url) {
      logAuthError("Falha ao iniciar login Google", error ?? "missing-google-url", { redirectTo: callbackUrl.toString() });
      redirect(`/login?error=${encodeURIComponent(error?.message ?? "nao-foi-possivel-iniciar-google")}`);
    }

    logAuth("Redirecionando para Google OAuth", { redirectTo: callbackUrl.toString() });
    redirect(data.url);
  } catch (error) {
    logAuthError("Excecao inesperada ao iniciar Google OAuth", error);
    redirect("/login?error=nao-foi-possivel-iniciar-google");
  }
}

export async function signInWithEmailAction(formData: FormData) {
  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) redirect("/login?error=credenciais-invalidas");

  let target = "/auth/callback";

  try {
    if (!hasSupabasePublicEnv()) {
      target = "/login?error=configuracao-supabase-incompleta";
    } else {
      logAuth("Login iniciado", { email: parsed.data.email });
      const supabase = await createServerClient();
      const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

      if (error) {
        const code = authErrorCode(error);
        logAuthError("Falha no signInWithPassword", error, { email: parsed.data.email, code });

        if (code === "email-nao-confirmado" && (await confirmAuthEmailByAddress(parsed.data.email))) {
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword(parsed.data);
          if (!retryError && retryData.user) {
            logAuth("Usuario autenticado apos confirmacao automatica", { userId: retryData.user.id });
            target = "/auth/callback";
          } else {
            if (retryError) logAuthError("Falha no retry de login", retryError, { email: parsed.data.email });
            target = `/login?error=${authErrorCode(retryError)}`;
          }
        } else {
          target = `/login?error=${code}`;
        }
      } else if (data.user) {
        logAuth("Usuario autenticado", { userId: data.user.id });
        target = "/auth/callback";
      } else {
        logAuthError("Login sem usuario na resposta", "missing-user", { email: parsed.data.email });
        target = "/login?error=erro-autenticacao";
      }
    }
  } catch (error) {
    logAuthError("Excecao inesperada no login", error, { email: parsed.data.email });
    target = "/login?error=erro-servidor-login";
  }

  logAuth("Redirecionando apos login", { route: target });
  redirect(target);
}

export async function registerProfessionalWithEmailAction(formData: FormData) {
  const parsed = professionalRegistrationSchema.safeParse({
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
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

  if (!parsed.success) redirect("/register?error=dados-invalidos");
  if (!canUseAdminClient()) redirect("/register?error=configuracao-supabase-incompleta");

  const data = parsed.data;
  const admin = createAdminClient();
  const { data: duplicatedCpf } = await admin.from("professionals").select("id,user_id").eq("cpf", onlyDigits(data.cpf)).maybeSingle();
  if (duplicatedCpf) redirect("/register?error=cpf-ja-cadastrado");

  const { data: createdUser, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      role: "professional"
    }
  });

  if (error || !createdUser.user) {
    redirect(`/register?error=${signupErrorCode(error)}`);
  }

  await saveProfessionalSignup(admin, createdUser.user.id, data);

  redirect("/login?message=cadastro-criado");
}

export async function registerCompanyWithEmailAction(formData: FormData) {
  const parsed = companyRegistrationSchema.safeParse({
    legalName: formData.get("legalName"),
    tradeName: formData.get("tradeName"),
    cnpj: formData.get("cnpj"),
    phone: formData.get("phone"),
    corporateEmail: formData.get("corporateEmail"),
    email: formData.get("email"),
    password: formData.get("password"),
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

  if (!parsed.success) redirect("/register?type=company&error=dados-invalidos");
  if (!canUseAdminClient()) redirect("/register?type=company&error=configuracao-supabase-incompleta");

  const data = parsed.data;
  const admin = createAdminClient();
  const { data: duplicatedCnpj } = await admin.from("companies").select("id,owner_id").eq("cnpj", onlyDigits(data.cnpj)).maybeSingle();
  if (duplicatedCnpj) redirect("/register?type=company&error=cnpj-ja-cadastrado");

  const { data: createdUser, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.contactName,
      role: "company"
    }
  });

  if (error || !createdUser.user) {
    redirect(`/register?type=company&error=${signupErrorCode(error)}`);
  }

  await saveCompanySignup(admin, createdUser.user.id, data);

  redirect("/login?message=cadastro-criado");
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) redirect("/forgot-password?error=email-invalido");

  const supabase = await createServerClient();
  const origin = await getAuthRedirectOrigin();
  let brandedEmailSent = false;

  if (canSendBrandedAuthEmail()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: parsed.data.email,
        options: {
          redirectTo: `${origin}/auth/callback?next=/update-password`
        }
      });

      const tokenHash = data.properties?.hashed_token;
      if (!error && tokenHash) {
        const resetUrl = new URL("/auth/confirm", origin);
        resetUrl.searchParams.set("token_hash", tokenHash);
        resetUrl.searchParams.set("type", "recovery");
        resetUrl.searchParams.set("next", "/update-password");

        const { error: emailError } = await sendTransactionalEmail({
          to: parsed.data.email,
          template: "password_reset",
          variables: { url: resetUrl.toString() }
        });

        brandedEmailSent = !emailError;
      }
    } catch {
      // If the branded sender is not ready, keep the recovery flow working through Supabase Auth.
    }
  }

  if (brandedEmailSent) redirect("/forgot-password?message=email-enviado");

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`
  });

  if (error) {
    const code = authErrorCode(error);
    if (code === "aguarde-um-minuto") redirect("/forgot-password?message=email-recente");
    redirect(`/forgot-password?error=${code}`);
  }
  redirect("/forgot-password?message=email-enviado");
}

export async function resendSignupConfirmationAction(formData: FormData) {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) redirect("/confirm-email?error=email-invalido");

  if (await confirmAuthEmailByAddress(parsed.data.email)) {
    redirect("/login?message=email-confirmado");
  }

  if (!hasSupabasePublicEnv()) redirect("/confirm-email?error=configuracao-supabase-incompleta");

  const supabase = await createServerClient();
  const origin = await getAuthRedirectOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`
    }
  });

  if (error) redirect(`/confirm-email?error=${authErrorCode(error)}`);
  redirect("/confirm-email?message=email-enviado");
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) redirect("/update-password?error=senhas-invalidas");

  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?error=sessao-expirada");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(`/update-password?error=${encodeURIComponent(error.message)}`);

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?message=senha-atualizada");
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?message=saiu");
}
