"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/access";
import { createServerClient } from "@/lib/supabase/server";

export async function updateMarketplaceFeatureAction(formData: FormData) {
  await requireRole("admin");
  const enabled = formData.get("enabled") === "on";
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("admin_set_feature", {
    feature_key: "marketplace_services",
    target_enabled: enabled
  });
  if (error) redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect(`/admin/settings?message=${enabled ? "marketplace-ativado" : "marketplace-desativado"}`);
}
