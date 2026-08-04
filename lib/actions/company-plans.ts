"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/access";
import { isCompanyPlanCode } from "@/lib/company-plans";
import { createServerClient } from "@/lib/supabase/server";

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "");
  return path.startsWith("/company/plans") && !path.startsWith("//") ? path : "/company/plans";
}

function friendlyPlanError(errorMessage?: string) {
  if (errorMessage?.includes("company_not_found")) return "Complete o cadastro da empresa antes de escolher um plano.";
  if (errorMessage?.includes("invalid_company_plan")) return "O plano selecionado não está disponível.";
  if (errorMessage?.includes("company_access_required")) return "Você não tem permissão para alterar o plano desta empresa.";
  return "Não foi possível atualizar o plano agora. Tente novamente.";
}

export async function changeCompanyPlanAction(formData: FormData) {
  await requireRole("company");
  const planCode = String(formData.get("planCode") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));
  if (!isCompanyPlanCode(planCode)) redirect(`${returnTo}?error=${encodeURIComponent("O plano selecionado não está disponível.")}`);

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("change_company_plan", { target_plan: planCode });
  if (error) redirect(`${returnTo}?error=${encodeURIComponent(friendlyPlanError(error.message))}`);

  revalidatePath("/company", "layout");
  redirect(`${returnTo}?message=plano-atualizado`);
}
