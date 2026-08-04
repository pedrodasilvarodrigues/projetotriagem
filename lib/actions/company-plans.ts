"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/access";
import { getCurrentCompanyPlanAccess } from "@/lib/companies/plan-access";
import { sendTransactionalEmail } from "@/lib/resend/send-email";
import { createServerClient } from "@/lib/supabase/server";

const selectablePlanSchema = z.enum(["essencial", "pro", "vip"]);

export async function chooseCompanyPlanAction(formData: FormData) {
  const parsed = selectablePlanSchema.safeParse(formData.get("plan"));
  if (!parsed.success) redirect("/company/plan?error=plano-invalido");

  const company = await getCurrentCompanyPlanAccess();
  if (!company) redirect("/onboarding/company");
  if (company.status_plano === "ativo") redirect("/company");
  if (company.status_plano === "pendente_ativacao") redirect("/company/plan/pending");

  const supabase = await createServerClient();
  const { error } = await supabase.rpc("choose_company_plan", { selected_plan: parsed.data });
  if (error) redirect(`/company/plan?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/company", "layout");
  redirect(parsed.data === "essencial" ? "/company?message=plano-essencial-ativado" : "/company/plan/pending?message=solicitacao-enviada");
}

export async function activateCompanyPlanAction(formData: FormData) {
  await requireRole("admin");
  const parsed = z.string().uuid().safeParse(formData.get("companyId"));
  if (!parsed.success) redirect("/admin/plan-activations?error=empresa-invalida");

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("activate_company_plan", { target_company_id: parsed.data });
  const activated = Array.isArray(data) ? data[0] : data;
  if (error || !activated) {
    redirect(`/admin/plan-activations?error=${encodeURIComponent(error?.message ?? "ativacao-nao-concluida")}`);
  }

  let notification = "email-nao-configurado";
  const { data: contact } = await supabase
    .from("company_contacts")
    .select("email")
    .eq("company_id", parsed.data)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const recipient = activated.company_email || contact?.email;

  if (recipient && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const result = await sendTransactionalEmail({
        to: recipient,
        template: "company_plan_activated",
        variables: {
          name: activated.company_name,
          plan: String(activated.plano).toUpperCase(),
          url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://projetotriagem.vercel.app"}/company`
        }
      });
      notification = result.error ? "email-falhou" : "email-enviado";
    } catch (emailError) {
      console.error("[plans] Plano ativado, mas o aviso por e-mail falhou", { companyId: parsed.data, error: emailError });
      notification = "email-falhou";
    }
  }

  revalidatePath("/admin/plan-activations");
  revalidatePath("/admin/companies");
  revalidatePath("/company", "layout");
  redirect(`/admin/plan-activations?message=plano-ativado&notification=${notification}`);
}
