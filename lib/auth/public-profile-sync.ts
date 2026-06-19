import type { User } from "@supabase/supabase-js";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

type AppRole = "company" | "professional";

function textFromMetadata(user: User, keys: string[]) {
  for (const key of keys) {
    const value = user.user_metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function fallbackName(user: User, role: AppRole) {
  return (
    textFromMetadata(user, ["full_name", "name", "display_name"]) ||
    user.email?.split("@")[0]?.trim() ||
    (role === "company" ? "Empresa em configuração" : "Profissional em configuração")
  );
}

function fallbackEmail(user: User) {
  return user.email?.trim().toLowerCase() || `${user.id}@pendente.local`;
}

function fallbackPhone(user: User) {
  return textFromMetadata(user, ["phone", "phone_number", "mobile_phone"]).replace(/\D/g, "") || null;
}

function placeholderCnpj(userId: string) {
  return `PENDENTE-${userId.replace(/-/g, "").slice(0, 20)}`;
}

export async function ensureProfessionalPublicProfile(user: User) {
  if (!hasSupabaseAdminEnv()) return;

  const admin = createAdminClient();
  const name = fallbackName(user, "professional");
  const email = fallbackEmail(user);
  const phone = fallbackPhone(user);

  const { data: profile } = await admin.from("profiles").select("id,full_name,email,phone,status").eq("id", user.id).maybeSingle();
  if (!profile?.id) {
    await admin.from("profiles").insert({
      id: user.id,
      full_name: name,
      email,
      phone,
      status: "pending"
    });
  } else {
    await admin
      .from("profiles")
      .update({
        full_name: profile.full_name || name,
        email: profile.email || email,
        phone: profile.phone || phone
      })
      .eq("id", user.id);
  }

  const { data: professional } = await admin
    .from("professionals")
    .select("id,full_name,email,phone,desired_role,education_level,city,state,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!professional?.id) {
    await admin.from("professionals").insert({
      user_id: user.id,
      full_name: name,
      email,
      phone,
      desired_role: "A definir",
      education_level: "medio",
      city: "",
      state: "",
      available_in_days: 0,
      status: "pending"
    });
    return;
  }

  await admin
    .from("professionals")
    .update({
      full_name: professional.full_name || name,
      email: professional.email || email,
      phone: professional.phone || phone,
      desired_role: professional.desired_role || "A definir",
      education_level: professional.education_level || "medio",
      city: professional.city ?? "",
      state: professional.state ?? ""
    })
    .eq("user_id", user.id);
}

export async function ensureCompanyPublicProfile(user: User) {
  if (!hasSupabaseAdminEnv()) return;

  const admin = createAdminClient();
  const name = fallbackName(user, "company");
  const email = fallbackEmail(user);
  const phone = fallbackPhone(user);

  const { data: profile } = await admin.from("profiles").select("id,full_name,email,phone,status").eq("id", user.id).maybeSingle();
  if (!profile?.id) {
    await admin.from("profiles").insert({
      id: user.id,
      full_name: name,
      email,
      phone,
      status: "pending"
    });
  } else {
    await admin
      .from("profiles")
      .update({
        full_name: profile.full_name || name,
        email: profile.email || email,
        phone: profile.phone || phone
      })
      .eq("id", user.id);
  }

  let { data: company } = await admin
    .from("companies")
    .select("id,legal_name,trade_name,cnpj,corporate_email,phone,city,state,status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!company?.id) {
    const { data: createdCompany } = await admin
      .from("companies")
      .insert({
        owner_id: user.id,
        legal_name: name,
        trade_name: name,
        cnpj: placeholderCnpj(user.id),
        corporate_email: email,
        phone,
        city: "",
        state: "",
        status: "pending"
      })
      .select("id,legal_name,trade_name,cnpj,corporate_email,phone,city,state,status")
      .single();
    company = createdCompany;
  } else {
    await admin
      .from("companies")
      .update({
        legal_name: company.legal_name || name,
        trade_name: company.trade_name || company.legal_name || name,
        corporate_email: company.corporate_email || email,
        phone: company.phone || phone,
        city: company.city ?? "",
        state: company.state ?? ""
      })
      .eq("owner_id", user.id);
  }

  if (!company?.id) return;

  const { data: contact } = await admin.from("company_contacts").select("id,name,email,phone").eq("company_id", company.id).limit(1).maybeSingle();
  if (!contact?.id) {
    await admin.from("company_contacts").insert({
      company_id: company.id,
      name,
      email,
      phone,
      role_title: null
    });
  } else {
    await admin
      .from("company_contacts")
      .update({
        name: contact.name || name,
        email: contact.email || email,
        phone: contact.phone || phone
      })
      .eq("id", contact.id);
  }
}
