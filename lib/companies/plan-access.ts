import { redirect } from "next/navigation";
import { getCurrentRole, requireRole } from "@/lib/auth/access";
import { createServerClient } from "@/lib/supabase/server";

export type CompanyPlanStatus = "nenhum" | "pendente_ativacao" | "ativo" | "inativo";
export type CompanyPlan = "nenhum" | "essencial" | "pro" | "vip";

export type CompanyPlanAccess = {
  id: string;
  owner_id: string;
  trade_name: string;
  corporate_email: string | null;
  phone: string | null;
  plano: CompanyPlan;
  status_plano: CompanyPlanStatus;
  plano_escolhido_em: string | null;
  plano_ativado_em: string | null;
};

export function companyPlanDestination(company: Pick<CompanyPlanAccess, "plano" | "status_plano">) {
  if (company.status_plano === "ativo") return "/company";
  if (company.status_plano === "pendente_ativacao") return "/company/plan/pending";
  return "/company/plan";
}

export async function getCurrentCompanyPlanAccess() {
  await requireRole("company");
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?error=sessao-expirada");

  const { data: company, error } = await supabase
    .from("companies")
    .select("id,owner_id,trade_name,corporate_email,phone,plano,status_plano,plano_escolhido_em,plano_ativado_em")
    .eq("owner_id", userData.user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) redirect("/login?error=nao-foi-possivel-verificar-o-plano");
  return company as CompanyPlanAccess | null;
}

export async function requireActiveCompanyPlan() {
  const company = await getCurrentCompanyPlanAccess();
  if (!company) redirect("/onboarding/company");
  if (company.status_plano !== "ativo") redirect(companyPlanDestination(company));
  return company;
}

export async function requireActivePlanWhenCompany() {
  const role = await getCurrentRole();
  if (role === "company") await requireActiveCompanyPlan();
  return role;
}
