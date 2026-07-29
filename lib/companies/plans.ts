export type CompanyPlan = "essencial" | "pro" | "vip";

export const PRO_SHORTLIST_LIMIT = 10;

export function hasProAccess(plan?: string | null) {
  return plan === "pro" || plan === "vip";
}

export function companyPlanLabel(plan?: string | null) {
  if (plan === "vip") return "VIP";
  if (plan === "pro") return "Pro";
  return "Essencial";
}
