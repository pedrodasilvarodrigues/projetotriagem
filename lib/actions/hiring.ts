"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/access";
import { requireActiveCompanyPlan } from "@/lib/companies/plan-access";
import { createServerClient } from "@/lib/supabase/server";

const processIdSchema = z.string().uuid();
const disputeResolutionSchema = z.enum(["hired", "not_hired"]);
const candidateVisibilitySchema = z.enum(["active", "archived", "removed"]);
const candidateViewSchema = z.enum(["active", "archived"]);

function hiringErrorCode(message?: string) {
  if (!message) return "nao-foi-possivel-concluir";
  if (message.includes("process_must_be_approved_by_admin")) return "candidato-ainda-nao-aprovado";
  if (message.includes("company_hire_already_confirmed")) return "contratacao-ja-informada";
  if (message.includes("professional_response_already_recorded")) return "resposta-ja-registrada";
  if (message.includes("hire_confirmation_expired")) return "prazo-de-confirmacao-encerrado";
  if (message.includes("hire_confirmation_not_in_dispute")) return "disputa-ja-resolvida";
  if (message.includes("candidate_process_must_be_closed")) return "candidato-ainda-em-andamento";
  if (message.includes("candidate_already_removed")) return "candidato-ja-removido";
  if (message.includes("hired_candidate_must_be_archived")) return "candidato-contratado-so-pode-ser-arquivado";
  if (message.includes("access_denied") || message.includes("required")) return "acesso-nao-autorizado";
  return "nao-foi-possivel-concluir";
}

export async function setCompanyCandidateVisibilityAction(formData: FormData) {
  await requireActiveCompanyPlan();
  const processId = processIdSchema.safeParse(formData.get("processId"));
  const targetVisibility = candidateVisibilitySchema.safeParse(formData.get("targetVisibility"));
  const currentView = candidateViewSchema.catch("active").parse(formData.get("currentView"));
  const returnPath = currentView === "archived" ? "/company/candidates?view=archived" : "/company/candidates";

  if (!processId.success || !targetVisibility.success) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=processo-invalido`);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("set_company_candidate_visibility", {
    target_process_id: processId.data,
    target_visibility: targetVisibility.data
  });
  if (error) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}error=${hiringErrorCode(error.message)}`);
  }

  revalidatePath("/company/candidates");
  const message = targetVisibility.data === "active"
    ? "candidato-restaurado"
    : targetVisibility.data === "archived"
      ? "candidato-arquivado"
      : "candidato-removido";
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}message=${message}`);
}

export async function companyConfirmHireAction(formData: FormData) {
  await requireActiveCompanyPlan();
  const parsed = processIdSchema.safeParse(formData.get("processId"));
  if (!parsed.success) redirect("/company/candidates?error=processo-invalido");

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("company_confirm_hire", { target_process_id: parsed.data });
  if (error) redirect(`/company/candidates?error=${hiringErrorCode(error.message)}`);

  revalidatePath("/company/candidates");
  revalidatePath("/professional/screening-status");
  revalidatePath("/professional/notifications");
  revalidatePath("/admin/hiring-disputes");
  redirect("/company/candidates?message=contratacao-enviada");
}

export async function professionalRespondHireAction(formData: FormData) {
  await requireRole("professional");
  const processId = processIdSchema.safeParse(formData.get("processId"));
  const response = z.enum(["yes", "no"]).safeParse(formData.get("response"));
  if (!processId.success || !response.success) {
    redirect("/professional/screening-status?error=resposta-invalida");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("professional_respond_hire", {
    target_process_id: processId.data,
    was_hired: response.data === "yes"
  });
  if (error) redirect(`/professional/screening-status?error=${hiringErrorCode(error.message)}`);

  revalidatePath("/professional/screening-status");
  revalidatePath("/professional/referrals");
  revalidatePath("/company/candidates");
  revalidatePath("/admin/hiring-disputes");
  revalidatePath("/admin/processes");
  redirect(`/professional/screening-status?message=${response.data === "yes" ? "contratacao-confirmada" : "divergencia-registrada"}`);
}

export async function adminResolveHireDisputeAction(formData: FormData) {
  await requireRole("admin");
  const confirmationId = z.string().uuid().safeParse(formData.get("confirmationId"));
  const resolution = disputeResolutionSchema.safeParse(formData.get("resolution"));
  const note = z.string().trim().min(5).max(1200).safeParse(formData.get("note"));
  if (!confirmationId.success || !resolution.success || !note.success) {
    redirect("/admin/hiring-disputes?error=preencha-a-justificativa");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_resolve_hire_dispute", {
    target_confirmation_id: confirmationId.data,
    resolution: resolution.data,
    internal_note: note.data
  });
  if (error) redirect(`/admin/hiring-disputes?error=${hiringErrorCode(error.message)}`);

  revalidatePath("/admin/hiring-disputes");
  revalidatePath("/admin/processes");
  revalidatePath("/company/candidates");
  revalidatePath("/professional/screening-status");
  redirect("/admin/hiring-disputes?message=disputa-resolvida");
}
