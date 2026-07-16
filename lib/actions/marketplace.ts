"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/access";
import { createServerClient } from "@/lib/supabase/server";

const clean = (value: FormDataEntryValue | null) => String(value ?? "").trim();
const optionalNumber = (value: FormDataEntryValue | null) => clean(value) ? Number(clean(value).replace(",", ".")) : null;

export async function saveProviderProfileAction(formData: FormData) {
  await requireRole("professional");
  const supabase = await createServerClient();
  const specialties = clean(formData.get("specialties")).split(",").map((v) => v.trim()).filter(Boolean);
  const { data: providerId, error } = await supabase.rpc("submit_service_provider_profile", {
    target_title: clean(formData.get("professionalTitle")),
    target_description: clean(formData.get("serviceDescription")),
    target_specialties: specialties,
    target_mode: clean(formData.get("serviceMode")),
    target_pricing: clean(formData.get("pricingModel")),
    target_starting_price: optionalNumber(formData.get("startingPrice")),
    target_availability: clean(formData.get("availability")) || null,
    target_experience: clean(formData.get("experienceDescription")) || null
  });
  if (error || !providerId) redirect(`/professional/services?error=${encodeURIComponent(error?.message ?? "perfil-invalido")}`);
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  await supabase.from("service_provider_categories").delete().eq("provider_id", providerId);
  if (categoryIds.length) {
    const { error: categoryError } = await supabase.from("service_provider_categories").insert(categoryIds.map((categoryId) => ({ provider_id: providerId, category_id: categoryId })));
    if (categoryError) redirect(`/professional/services?error=${encodeURIComponent(categoryError.message)}`);
  }
  await supabase.from("service_provider_areas").delete().eq("provider_id", providerId);
  const city = clean(formData.get("city"));
  const state = clean(formData.get("state")).toUpperCase();
  if (city && state) await supabase.from("service_provider_areas").insert({ provider_id: providerId, city, state, region_name: clean(formData.get("regionName")) || null, radius_km: Number(clean(formData.get("radiusKm")) || 20) });
  revalidatePath("/professional/services");
  redirect("/professional/services?success=enviado-para-analise");
}

export async function uploadPortfolioAction(formData: FormData) {
  await requireRole("professional");
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const providerId = clean(formData.get("providerId"));
  const file = formData.get("image");
  if (!userData.user || !providerId || !(file instanceof File) || !file.type.startsWith("image/") || file.size > 8_000_000) redirect("/professional/services?error=imagem-invalida");
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
  const path = `${userData.user.id}/${providerId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("provider-portfolios").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) redirect(`/professional/services?error=${encodeURIComponent(uploadError.message)}`);
  const { error } = await supabase.from("service_provider_portfolio").insert({ provider_id: providerId, title: clean(formData.get("title")) || "Trabalho realizado", description: clean(formData.get("description")) || null, storage_path: path });
  if (error) { await supabase.storage.from("provider-portfolios").remove([path]); redirect(`/professional/services?error=${encodeURIComponent(error.message)}`); }
  revalidatePath("/professional/services");
}

export async function saveClientProfileAction(formData: FormData) {
  await requireRole("client");
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { error } = await supabase.from("client_profiles").upsert({ user_id: data.user.id, city: clean(formData.get("city")), state: clean(formData.get("state")).toUpperCase(), region_name: clean(formData.get("regionName")) || null, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) redirect(`/client?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/client");
}

export async function startConversationAction(formData: FormData) {
  await requireRole("client");
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("start_marketplace_conversation", { target_provider_id: clean(formData.get("providerId")) });
  if (error || !data) redirect(`/services?error=${encodeURIComponent(error?.message ?? "conversa-indisponivel")}`);
  redirect(`/marketplace/conversations/${data}`);
}

export async function sendMarketplaceMessageAction(formData: FormData) {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const conversationId = clean(formData.get("conversationId"));
  const body = clean(formData.get("body"));
  if (!data.user || !conversationId || !body) return;
  const { error } = await supabase.from("marketplace_messages").insert({ conversation_id: conversationId, sender_id: data.user.id, body });
  if (error) redirect(`/marketplace/conversations/${conversationId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/marketplace/conversations/${conversationId}`);
}

export async function createServiceRequestAction(formData: FormData) {
  await requireRole("client");
  const supabase = await createServerClient();
  const conversationId = clean(formData.get("conversationId"));
  const { error } = await supabase.rpc("create_service_request", { target_conversation_id: conversationId, target_title: clean(formData.get("title")), target_description: clean(formData.get("description")), target_pricing: clean(formData.get("pricingModel")), target_amount: optionalNumber(formData.get("amount")) });
  if (error) redirect(`/marketplace/conversations/${conversationId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/marketplace/conversations/${conversationId}`);
}

export async function transitionServiceRequestAction(formData: FormData) {
  const supabase = await createServerClient();
  const conversationId = clean(formData.get("conversationId"));
  const { error } = await supabase.rpc("transition_service_request", { target_request_id: clean(formData.get("requestId")), target_status: clean(formData.get("status")), target_note: clean(formData.get("note")) || null });
  if (error) redirect(`/marketplace/conversations/${conversationId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/marketplace/conversations/${conversationId}`);
}

export async function confirmServiceCompletionAction(formData: FormData) {
  const supabase = await createServerClient();
  const conversationId = clean(formData.get("conversationId"));
  const { error } = await supabase.rpc("confirm_service_completion", { target_request_id: clean(formData.get("requestId")) });
  if (error) redirect(`/marketplace/conversations/${conversationId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/marketplace/conversations/${conversationId}`);
}

export async function createServiceReviewAction(formData: FormData) {
  await requireRole("client");
  const supabase = await createServerClient();
  const conversationId = clean(formData.get("conversationId"));
  const { error } = await supabase.rpc("create_service_review", { target_request_id: clean(formData.get("requestId")), target_rating: Number(clean(formData.get("rating"))), target_comment: clean(formData.get("comment")) || null });
  if (error) redirect(`/marketplace/conversations/${conversationId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/marketplace/conversations/${conversationId}`);
}

export async function reportMarketplaceAction(formData: FormData) {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const conversationId = clean(formData.get("conversationId"));
  if (!data.user) redirect("/login");
  const { error } = await supabase.from("marketplace_reports").insert({ reporter_id: data.user.id, report_type: clean(formData.get("reportType")), provider_id: clean(formData.get("providerId")) || null, conversation_id: conversationId || null, request_id: clean(formData.get("requestId")) || null, reason: clean(formData.get("reason")), description: clean(formData.get("description")) || null });
  if (error) redirect(`${conversationId ? `/marketplace/conversations/${conversationId}` : "/services"}?error=${encodeURIComponent(error.message)}`);
  redirect(`${conversationId ? `/marketplace/conversations/${conversationId}` : "/services"}?success=denuncia-enviada`);
}

export async function moderateProviderAction(formData: FormData) {
  await requireRole("admin");
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_moderate_service_provider", { target_provider_id: clean(formData.get("providerId")), target_status: clean(formData.get("status")), target_reason: clean(formData.get("reason")) || null });
  if (error) redirect(`/admin/service-providers?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/service-providers");
}

export async function saveServiceCategoryAction(formData: FormData) {
  await requireRole("admin");
  const supabase = await createServerClient();
  const id = clean(formData.get("id"));
  const name = clean(formData.get("name"));
  const payload = { name, slug: clean(formData.get("slug")) || name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), parent_id: clean(formData.get("parentId")) || null, display_order: Number(clean(formData.get("displayOrder")) || 0), is_active: formData.get("isActive") === "on", updated_at: new Date().toISOString() };
  const result = id ? await supabase.from("service_categories").update(payload).eq("id", id) : await supabase.from("service_categories").insert(payload);
  if (result.error) redirect(`/admin/service-categories?error=${encodeURIComponent(result.error.message)}`);
  revalidatePath("/admin/service-categories");
}

export async function deleteServiceCategoryAction(formData: FormData) {
  await requireRole("admin");
  const supabase = await createServerClient();
  const { error } = await supabase.from("service_categories").delete().eq("id", clean(formData.get("id")));
  if (error) redirect(`/admin/service-categories?error=${encodeURIComponent("Categoria em uso: desative-a em vez de excluir.")}`);
  revalidatePath("/admin/service-categories");
}

export async function moderatePortfolioAction(formData: FormData) {
  await requireRole("admin");
  const supabase = await createServerClient();
  const { error } = await supabase.from("service_provider_portfolio").update({ moderation_status: clean(formData.get("status")), updated_at: new Date().toISOString() }).eq("id", clean(formData.get("portfolioId")));
  if (error) redirect(`/admin/service-providers?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/service-providers");
}

export async function resolveMarketplaceReportAction(formData: FormData) {
  await requireRole("admin");
  const supabase = await createServerClient();
  const reportId = clean(formData.get("reportId"));
  const status = clean(formData.get("status"));
  const { data } = await supabase.auth.getUser();
  await supabase.from("marketplace_reports").update({ status, resolved_at: status === "resolved" || status === "archived" ? new Date().toISOString() : null }).eq("id", reportId);
  if (data.user) await supabase.from("marketplace_moderation_actions").insert({ report_id: reportId, admin_id: data.user.id, action_type: status === "archived" ? "archive_report" : "warn", reason: clean(formData.get("reason")) || null });
  revalidatePath("/admin/marketplace-reports");
}
