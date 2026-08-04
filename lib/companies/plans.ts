export type CompanyPlan = "nenhum" | "essencial" | "pro" | "vip";

export const PRO_SHORTLIST_LIMIT = 10;

export function hasProAccess(plan?: string | null) {
  return plan === "pro" || plan === "vip";
}

export function companyPlanLabel(plan?: string | null) {
  if (plan === "vip") return "VIP";
  if (plan === "pro") return "Pro";
  if (plan === "nenhum") return "Não escolhido";
  return "Essencial";
}
