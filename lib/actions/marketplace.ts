"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentRole, requireRole } from "@/lib/auth/access";
import { appendSearchParam, safeInternalRedirect } from "@/lib/auth/safe-redirect";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-email";
import {
  SERVICE_POST_MAX_IMAGES,
  SERVICE_POSTS_BUCKET
} from "@/lib/marketplace/explore";

const clean = (value: FormDataEntryValue | null) => String(value ?? "").trim();
const optionalNumber = (value: FormDataEntryValue | null) => clean(value) ? Number(clean(value).replace(",", ".")) : null;

type ServicePostActionResult = { ok: true } | { ok: false; error: string };

function validatePostDescription(value: string) {
  const description = value.trim();
  if (description.length < 3) return "Descreva o trabalho em pelo menos 3 caracteres.";
  if (description.length > 1000) return "A descrição deve ter no máximo 1.000 caracteres.";
  return null;
}

function validatePostPaths(paths: string[], userId: string, providerId: string) {
  const expectedPrefix = `${userId}/${providerId}/`;
  return paths.length >= 1
    && paths.length <= SERVICE_POST_MAX_IMAGES
    && paths.every((path) => path.startsWith(expectedPrefix) && !path.includes(".."));
}

export async function createServicePostAction(input: {
  providerId: string;
  description: string;
  imagePaths: string[];
}): Promise<ServicePostActionResult> {
  await requireRole("professional");
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };

  const descriptionError = validatePostDescription(input.description);
  if (descriptionError) return { ok: false, error: descriptionError };
  if (!validatePostPaths(input.imagePaths, userData.user.id, input.providerId)) {
    return { ok: false, error: "As imagens enviadas não são válidas." };
  }

  const { data: provider } = await supabase
    .from("service_provider_profiles")
    .select("id,status")
    .eq("id", input.providerId)
    .maybeSingle();
  if (!provider || provider.status === "banned") {
    return { ok: false, error: "Perfil de prestador indisponível para publicações." };
  }

  const { error } = await supabase.from("service_posts").insert({
    provider_id: input.providerId,
    images: input.imagePaths,
    description: input.description.trim(),
    status: "published"
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/professional/services");
  revalidatePath("/professional");
  revalidatePath("/client");
  return { ok: true };
}

export async function updateServicePostAction(input: {
  postId: string;
  description: string;
  imagePaths?: string[];
}): Promise<ServicePostActionResult> {
  await requireRole("professional");
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };

  const descriptionError = validatePostDescription(input.description);
  if (descriptionError) return { ok: false, error: descriptionError };

  const { data: post, error: readError } = await supabase
    .from("service_posts")
    .select("id,provider_id,images")
    .eq("id", input.postId)
    .maybeSingle();
  if (readError || !post) return { ok: false, error: "Publicação não encontrada." };

  const replacementPaths = input.imagePaths?.length ? input.imagePaths : null;
  if (replacementPaths && !validatePostPaths(replacementPaths, userData.user.id, post.provider_id)) {
    return { ok: false, error: "As novas imagens não são válidas." };
  }

  const { error } = await supabase
    .from("service_posts")
    .update({
      description: input.description.trim(),
      ...(replacementPaths ? { images: replacementPaths } : {}),
      status: "published"
    })
    .eq("id", input.postId);
  if (error) return { ok: false, error: error.message };

  if (replacementPaths) {
    await supabase.storage.from(SERVICE_POSTS_BUCKET).remove(post.images ?? []);
  }

  revalidatePath("/professional/services");
  revalidatePath("/professional");
  revalidatePath("/client");
  revalidatePath(`/services/posts/${input.postId}`);
  return { ok: true };
}

export async function deleteServicePostAction(postId: string): Promise<ServicePostActionResult> {
  await requireRole("professional");
  const supabase = await createServerClient();
  const { data: post, error: readError } = await supabase
    .from("service_posts")
    .select("id,images")
    .eq("id", postId)
    .maybeSingle();
  if (readError || !post) return { ok: false, error: "Publicação não encontrada." };

  const { error } = await supabase
    .from("service_posts")
    .update({ status: "removed" })
    .eq("id", postId);
  if (error) return { ok: false, error: error.message };

  await supabase.storage.from(SERVICE_POSTS_BUCKET).remove(post.images ?? []);
  revalidatePath("/professional/services");
  revalidatePath("/professional");
  revalidatePath("/client");
  revalidatePath(`/services/posts/${postId}`);
  return { ok: true };
}

export async function saveProviderProfileAction(formData: FormData) {
  await requireRole("professional");
  const redirectTo = clean(formData.get("redirectTo"));
  const destination = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/professional/services";
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
  if (error || !providerId) redirect(`${destination}?error=${encodeURIComponent(error?.message ?? "perfil-invalido")}`);
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  await supabase.from("service_provider_categories").delete().eq("provider_id", providerId);
  if (categoryIds.length) {
    const { error: categoryError } = await supabase.from("service_provider_categories").insert(categoryIds.map((categoryId) => ({ provider_id: providerId, category_id: categoryId })));
    if (categoryError) redirect(`${destination}?error=${encodeURIComponent(categoryError.message)}`);
  }
  await supabase.from("service_provider_areas").delete().eq("provider_id", providerId);
  const city = clean(formData.get("city"));
  const state = clean(formData.get("state")).toUpperCase();
  if (city && state) await supabase.from("service_provider_areas").insert({ provider_id: providerId, city, state, region_name: clean(formData.get("regionName")) || null, radius_km: Number(clean(formData.get("radiusKm")) || 20) });
  revalidatePath("/professional/services");
  revalidatePath("/professional/profile");
  redirect(`${destination}?success=enviado-para-analise`);
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
  const supabase = await createServerClient();
  const providerId = clean(formData.get("providerId"));
  const returnTo = safeInternalRedirect(formData.get("returnTo"), providerId ? `/services/providers/${providerId}` : "/services");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(appendSearchParam("/login?error=sessao-expirada", "next", returnTo));
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (roleError || (roleRecord?.role !== "client" && roleRecord?.role !== "professional")) {
    redirect(appendSearchParam(returnTo, "error", "marketplace_requester_required"));
  }

  const { data: conversationId, error } = await supabase.rpc("start_marketplace_conversation", {
    target_provider_id: providerId
  });
  if (error || !conversationId) {
    redirect(appendSearchParam(returnTo, "error", error?.message ?? "conversation_unavailable"));
  }

  redirect(`/marketplace/conversations/${conversationId}`);
}

export async function sendMarketplaceMessageAction(formData: FormData) {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const conversationId = clean(formData.get("conversationId"));
  const body = clean(formData.get("body"));
  if (!data.user || !conversationId || !body) return;
  const { error } = await supabase.from("marketplace_messages").insert({ conversation_id: conversationId, sender_id: data.user.id, body });
  if (error) redirect(`/marketplace/conversations/${conversationId}?error=${encodeURIComponent(error.message)}`);
  if (hasSupabaseAdminEnv() && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const admin = createAdminClient();
      const { data: conversation } = await admin.from("marketplace_conversations").select("requester_user_id,provider_id").eq("id", conversationId).single();
      if (conversation) {
        const { data: provider } = await admin.from("service_provider_profiles").select("professional:professionals(user_id)").eq("id", conversation.provider_id).single();
        const relation = provider?.professional as unknown as { user_id?: string } | { user_id?: string }[] | null;
        const providerUserId = Array.isArray(relation) ? relation[0]?.user_id : relation?.user_id;
        const recipientId = data.user.id === conversation.requester_user_id ? providerUserId : conversation.requester_user_id;
        if (recipientId) {
          const { data: recipient } = await admin.from("profiles").select("email,full_name").eq("id", recipientId).maybeSingle();
          if (recipient?.email) await sendTransactionalEmail({ to: recipient.email, template: "marketplace_message", variables: { name: recipient.full_name || "usuário", preview: body.slice(0, 160), url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://projetotriagem.vercel.app"}/marketplace/conversations/${conversationId}` } });
        }
      }
    } catch (emailError) {
      console.error("[marketplace] Falha na notificação por e-mail", emailError);
    }
  }
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
  const role = await getCurrentRole();
  if (role !== "client" && role !== "professional") redirect("/acesso-negado");
  const supabase = await createServerClient();
  const conversationId = clean(formData.get("conversationId"));
  const rating = Number(clean(formData.get("rating")));
  const comment = clean(formData.get("comment"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/marketplace/conversations/${conversationId}?error=invalid_rating`);
  }
  if (comment.length > 2000) {
    redirect(`/marketplace/conversations/${conversationId}?error=review_comment_too_long`);
  }

  const { data: reviewId, error } = await supabase.rpc("create_service_conversation_review", {
    target_conversation_id: conversationId,
    target_rating: rating,
    target_comment: comment || null
  });
  if (error) {
    const errorCode = error.code === "23505" ? "review_already_submitted" : error.message;
    redirect(`/marketplace/conversations/${conversationId}?error=${encodeURIComponent(errorCode)}`);
  }

  const { data: review } = reviewId
    ? await supabase.from("service_reviews").select("provider_id").eq("id", reviewId).maybeSingle()
    : { data: null };
  revalidatePath(`/marketplace/conversations/${conversationId}`);
  revalidatePath("/services");
  revalidatePath("/professional");
  if (review?.provider_id) {
    revalidatePath(`/services/providers/${review.provider_id}`);
    revalidatePath("/professional/services");
  }
  redirect(`/marketplace/conversations/${conversationId}?success=avaliacao-publicada`);
}

export async function setServiceOfferingAction(formData: FormData) {
  await requireRole("professional");
  const enabled = formData.get("enabled") === "on" || formData.get("enabled") === "true";
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("set_service_offering", { target_enabled: enabled });
  if (error) redirect(`/professional/profile?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/professional/profile");
  revalidatePath("/professional/services");
  redirect(`/professional/profile?message=${enabled ? "servicos-ativados" : "servicos-desativados"}${enabled ? "&offerServices=1" : ""}`);
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
  const providerId = clean(formData.get("providerId"));
  const status = clean(formData.get("status"));
  const reason = clean(formData.get("reason"));
  const validStatuses = ["approved", "rejected", "suspended", "pending"];

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(providerId) || !validStatuses.includes(status)) {
    redirect("/admin/service-providers?error=solicitacao-invalida");
  }
  if ((status === "rejected" || status === "suspended") && !reason) {
    redirect("/admin/service-providers?error=motivo-obrigatorio");
  }

  const { error } = await supabase.rpc("admin_moderate_service_provider", {
    target_provider_id: providerId,
    target_status: status,
    target_reason: reason || null
  });
  if (error) redirect(`/admin/service-providers?error=${encodeURIComponent(error.message)}`);

  const { data: updatedProvider, error: verificationError } = await supabase
    .from("service_provider_profiles")
    .select("status")
    .eq("id", providerId)
    .maybeSingle();
  if (verificationError || updatedProvider?.status !== status) {
    redirect("/admin/service-providers?error=aprovacao-nao-confirmada");
  }

  revalidatePath("/admin/service-providers");
  revalidatePath("/services");
  revalidatePath("/professional");
  revalidatePath("/professional/services");
  redirect(`/admin/service-providers?success=${encodeURIComponent(status)}`);
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

export async function markMarketplaceNotificationsReadAction() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { error } = await supabase.from("marketplace_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", data.user.id).is("read_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/professional/notifications");
  revalidatePath("/client/notifications");
}
